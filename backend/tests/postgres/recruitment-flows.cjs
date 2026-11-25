const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let database;
try {
  database = new URL(process.env.SRMS_TEST_DATABASE_URL);
} catch {
  throw new Error('Set SRMS_TEST_DATABASE_URL to a migrated disposable PostgreSQL database.');
}
assert.ok(
  database.protocol === 'postgresql:' && database.hostname === '127.0.0.1'
    && /^\/srms_test_[a-z0-9_]+$/.test(database.pathname) && !database.search && !database.hash,
  'Integration tests require a loopback PostgreSQL database named srms_test_*.'
);

const secret = 'srms-local-postgres-regression-secret';
process.env.DATABASE_URL = database.href;
process.env.DIRECT_URL = database.href;
process.env.JWT_SECRET = secret;
process.env.PORT = '0';
const cvStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'srms-test-cv-'));
process.env.CV_STORAGE_DIR = cvStorage;

const prisma = require('../../dist/config/db.js').default;
let server, baseUrl;
before(async () => {
  ({ server } = require('../../dist/server.js'));
  if (!server.listening) await once(server, 'listening');
  baseUrl = 'http://127.0.0.1:' + server.address().port + '/api/v1';
});
after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await prisma.$disconnect();
  const storage = fs.realpathSync(cvStorage);
  assert.equal(path.dirname(storage), fs.realpathSync(os.tmpdir()));
  assert.match(path.basename(storage), /^srms-test-cv-/);
  fs.rmSync(storage, { recursive: true, force: true });
});

async function request(method, path, user, body) {
  const isForm = body instanceof FormData;
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(user ? { Authorization: 'Bearer ' + jwt.sign({ id: user.id, role: user.role, email: user.email }, secret) } : {}),
      ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined || isForm ? body : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  const responseBody = contentType.includes('application/json')
    ? await response.json()
    : Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: response.headers, body: responseBody };
}

const newUser = (role, passwordHash = 'fixture') => prisma.user.create({
  data: { email: randomUUID() + '@example.test', passwordHash, role },
});

const newJob = (recruiter, company) => prisma.job.create({
  data: { title: 'Test job', description: 'Description', requirements: 'Requirements', location: 'Hanoi',
    recruiterId: recruiter.id, companyId: company.id },
});

async function recruitmentFixture() {
  const [candidate, recruiter, company] = await Promise.all([
    newUser('CANDIDATE'), newUser('RECRUITER'), prisma.company.create({ data: { name: 'Test company' } }),
  ]);
  const job = await newJob(recruiter, company);
  return { candidate, recruiter, company, job };
}

async function interviewFixture() {
  const { candidate, recruiter, job } = await recruitmentFixture();
  const applied = await request('POST', '/application/apply', candidate, { jobId: job.id });
  assert.equal(applied.status, 201);
  return { applicationId: applied.body.application.id, recruiter };
}

const inHours = hours => new Date(Date.now() + hours * 3_600_000).toISOString();
const venue = { locationOrLink: 'https://example.test/interview', interviewerName: 'Test interviewer', type: 'ONLINE' };

test('parallel first applications to one job create one profile and report duplicate applications consistently', async () => {
  const { candidate, job } = await recruitmentFixture();
  const replies = await Promise.all(Array.from({ length: 8 }, () =>
    request('POST', '/application/apply', candidate, { jobId: job.id })
  ));

  const winners = replies.filter(reply => reply.status === 201);
  assert.equal(winners.length, 1);
  const others = replies.filter(reply => reply.status !== 201);
  assert.ok(others.every(reply => reply.status === 400 && reply.body.code === 'ALREADY_APPLIED'));
  assert.equal(await prisma.candidateProfile.count({ where: { userId: candidate.id } }), 1);
  assert.equal(await prisma.application.count({ where: { jobId: job.id, candidateId: winners[0].body.application.candidateId } }), 1);
});

test('parallel first applications to different jobs reuse one profile and both succeed', async () => {
  const { candidate, recruiter, company, job } = await recruitmentFixture();
  const second = await newJob(recruiter, company);
  const replies = await Promise.all([job, second].map(item =>
    request('POST', '/application/apply', candidate, { jobId: item.id })
  ));
  assert.deepEqual(replies.map(reply => reply.status), [201, 201]);
  assert.equal(replies[0].body.application.candidateId, replies[1].body.application.candidateId);
  assert.equal(await prisma.candidateProfile.count({ where: { userId: candidate.id } }), 1);
});

test('parallel interview creation uses PostgreSQL uniqueness and preserves completed and cancelled history', async () => {
  const { applicationId, recruiter } = await interviewFixture();
  const scheduledAt = inHours(36);
  const data = { applicationId, scheduledAt, ...venue };
  for (const status of ['COMPLETED', 'CANCELLED']) {
    await prisma.interview.create({ data: { ...data, status } });
  }
  const replies = await Promise.all(Array.from({ length: 8 }, () =>
    request('POST', '/interview', recruiter, data)
  ));
  assert.equal(replies.filter(reply => reply.status === 201).length, 1);
  assert.equal(replies.filter(reply => reply.status === 409).length, 7);

  const rows = await prisma.interview.findMany({ where: { applicationId, scheduledAt }, select: { status: true } });
  assert.deepEqual(rows.map(row => row.status).sort(), ['CANCELLED', 'COMPLETED', 'SCHEDULED']);
  await assert.rejects(prisma.interview.create({ data }), { code: 'P2002' });
});

test('parallel interview updates to the same slot allow only one move', async () => {
  const { applicationId, recruiter } = await interviewFixture();
  const [first, second] = await Promise.all([24, 48].map(hours =>
    prisma.interview.create({ data: { applicationId, scheduledAt: inHours(hours), ...venue } })
  ));
  const scheduledAt = inHours(72);
  const replies = await Promise.all([first, second].map(item =>
    request('PUT', '/interview/' + item.id, recruiter, { scheduledAt })
  ));
  assert.deepEqual(replies.map(reply => reply.status).sort(), [200, 409]);
  assert.equal(await prisma.interview.count({ where: { applicationId, scheduledAt, status: 'SCHEDULED' } }), 1);
  assert.equal(await prisma.interview.count({ where: { applicationId, status: 'SCHEDULED' } }), 2);
});

const profilePath = '/candidate/profile';

test('profile updates distinguish omitted fields from explicit NULL and blank values', async () => {
  const candidate = await newUser('CANDIDATE');
  const original = { resumeUrl: 'https://example.test/cv.pdf', experience: { years: 3 }, education: { school: 'Example' } };
  const saved = await request('PUT', profilePath, candidate, original);
  assert.equal(saved.status, 201);

  const omitted = await request('PUT', profilePath, candidate, { fullName: 'Example Candidate' });
  assert.equal(omitted.status, 200);
  for (const [field, value] of Object.entries(original)) assert.deepEqual(omitted.body.profile[field], value);
  for (const badLink of [false, 'https:///']) {
    assert.equal((await request('PUT', profilePath, candidate, { resumeUrl: badLink })).status, 400);
  }

  assert.equal((await request('PUT', profilePath, candidate, { resumeUrl: '  ', experience: null, education: '' })).status, 200);
  const read = await request('GET', profilePath, candidate);
  assert.equal(read.status, 200);
  assert.deepEqual([read.body.resumeUrl, read.body.experience, read.body.education], [null, null, null]);
  const rows = await prisma.$queryRaw`SELECT "experience" IS NULL AS experience_null, "education" IS NULL AS education_null
    FROM "CandidateProfile" WHERE "userId" = ${candidate.id}`;
  assert.deepEqual(rows, [{ experience_null: true, education_null: true }]);
});

function samplePdf() {
  const stream = 'BT /F1 18 Tf 30 680 Td (Synthetic CV) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'];
  let pdf = '%PDF-1.4\n';
  const positions = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += (index + 1) + ' 0 obj\n' + object + '\nendobj\n';
    return String(offset).padStart(10, '0') + ' 00000 n \n';
  });
  const xref = pdf.length;
  return Buffer.from(pdf + 'xref\n0 6\n0000000000 65535 f \n' + positions.join('') +
    'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
}

test('Unicode CV filenames round-trip and clearing the profile link preserves the uploaded file', async () => {
  const candidate = await newUser('CANDIDATE');
  const filename = 'Hồ sơ Nguyễn 日本語 😀.pdf';
  const pdf = samplePdf();
  const form = new FormData();
  form.append('resume', new Blob([pdf], { type: 'application/pdf' }), filename);
  const upload = await request('POST', '/candidate/resume', candidate, form);
  assert.equal(upload.status, 200);
  assert.equal(upload.body.resume.fileName, filename);

  const invalid = new FormData();
  invalid.append('resume', new Blob([pdf], { type: 'text/plain' }), 'invalid.pdf');
  assert.equal((await request('POST', '/candidate/resume', candidate, invalid)).status, 400);
  assert.equal((await request('PUT', profilePath, candidate, { resumeUrl: 'https://example.test/alternate' })).status, 200);
  const cleared = await request('PUT', profilePath, candidate, { resumeUrl: null });
  assert.equal(cleared.status, 200);
  assert.equal(cleared.body.profile.resumeUrl, null);
  assert.equal(cleared.body.profile.resumeFileName, filename);
  assert.equal(cleared.body.profile.resumeFileSize, pdf.length);

  const download = await request('GET', '/candidate/resume/file?download=true', candidate);
  assert.equal(download.status, 200);
  const disposition = download.headers.get('content-disposition');
  assert.match(disposition, /^attachment;/);
  const extendedName = disposition.match(/filename\*=UTF-8''([^;]+)/)[1];
  assert.equal(decodeURIComponent(extendedName), filename);
  assert.deepEqual(download.body, pdf);
});

test('applications require resume changes to go through the candidate profile', async () => {
  const { candidate, job } = await recruitmentFixture();
  const resume = 'https://example.test/original.pdf';
  const input = { jobId: job.id, resumeUrl: 'https://example.test/new.pdf' };
  const beforeProfile = await request('POST', '/application/apply', candidate, input);
  assert.equal(beforeProfile.status, 400);
  assert.equal(beforeProfile.body.code, 'RESUME_PROFILE_ONLY');
  assert.equal(await prisma.candidateProfile.count({ where: { userId: candidate.id } }), 0);

  assert.equal((await request('PUT', profilePath, candidate, { resumeUrl: resume })).status, 201);
  const existingProfile = await request('POST', '/application/apply', candidate, input);
  assert.equal(existingProfile.status, 400);
  assert.equal(existingProfile.body.code, 'RESUME_PROFILE_ONLY');
  assert.equal((await request('POST', '/application/apply', candidate, { jobId: job.id })).status, 201);
  assert.equal((await request('GET', profilePath, candidate)).body.resumeUrl, resume);
});

test('unsupported roles receive a clear 403 at sign-in and when using an older session token', async () => {
  const password = 'Local-demo-regression-only';
  const hash = await bcrypt.hash(password, 4);
  for (const role of ['MANAGER', 'INTERVIEWER']) {
    const account = await newUser(role, hash);
    const login = await request('POST', '/auth/login', null, { email: account.email, password });
    assert.equal(login.status, 403);
    assert.equal(login.body.code, 'UNSUPPORTED_ROLE');
    assert.match(login.body.message, /Candidate, Recruiter, or Administrator/);
    assert.equal(login.body.token, undefined);
    const expiredAccess = await request('GET', '/application/recruiter', account);
    assert.equal(expiredAccess.status, 403);
    assert.equal(expiredAccess.body.code, 'UNSUPPORTED_ROLE');
  }
});

test('supported roles still sign in and can use the issued token', async () => {
  const password = 'Local-demo-regression-only';
  const hash = await bcrypt.hash(password, 4);
  for (const role of ['CANDIDATE', 'RECRUITER', 'ADMIN']) {
    const account = await newUser(role, hash);
    const login = await request('POST', '/auth/login', null, { email: account.email, password });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.role, role);
    const me = await fetch(baseUrl + '/auth/me', { headers: { Authorization: 'Bearer ' + login.body.token } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.id, account.id);
  }
});
