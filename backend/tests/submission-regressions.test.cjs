const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, beforeEach, test } = require('node:test');
const jwt = require('jsonwebtoken');

const database = require('../dist/config/db.js');
const prisma = {};
const secret = 'srms-submission-regression-test-secret';
const origin = 'http://frontend.example.test';
const recruiter = { id: 'recruiter-1', role: 'RECRUITER' };
const otherRecruiter = { id: 'recruiter-2', role: 'RECRUITER' };
const candidate = { id: 'candidate-1', role: 'CANDIDATE' };
const admin = { id: 'admin-1', role: 'ADMIN' };
const application = { id: 'application-1', job: { recruiterId: recruiter.id } };
const meetingUrl = 'https://meet.example.test/interview';
let server, baseUrl;

before(async () => {
  database.default = prisma;
  process.env.PORT = '0';
  process.env.JWT_SECRET = secret;
  ({ server } = require('../dist/server.js'));
  if (!server.listening) await once(server, 'listening');
  baseUrl = 'http://127.0.0.1:' + server.address().port + '/api/v1';
});

beforeEach(() => {
  for (const model of Object.keys(prisma)) delete prisma[model];
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

async function request(path, { method = 'GET', user, body, headers = {} } = {}) {
  const authorization = user ? 'Bearer ' + jwt.sign(user, secret) : undefined;
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(authorization && { Authorization: authorization }),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    headers: response.headers,
    body: response.status === 204 ? undefined : await response.json(),
  };
}

test('cross-origin PATCH allows recruiter and admin to close and reopen jobs', async () => {
  let job = { id: 'job-1', recruiterId: recruiter.id, isActive: true };
  prisma.job = {
    findUnique: async () => job,
    update: async ({ data }) => (job = { ...job, ...data }),
  };

  const path = '/job/manage/job-1/toggle';
  const preflight = await request(path, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
  assert.equal(preflight.headers.get('access-control-allow-credentials'), null);
  assert.equal(preflight.headers.get('access-control-allow-headers'), 'Content-Type,Authorization');
  assert.deepEqual(preflight.headers.get('access-control-allow-methods').split(',').sort(), [
    'DELETE', 'GET', 'PATCH', 'POST', 'PUT',
  ]);

  for (const user of [recruiter, admin]) {
    for (const isActive of [false, true]) {
      const result = await request(path, { method: 'PATCH', user, headers: { Origin: origin } });
      assert.equal(result.status, 200);
      assert.equal(result.headers.get('access-control-allow-origin'), '*');
      assert.equal(result.body.job.isActive, isActive);
    }
  }

  for (const user of [otherRecruiter, candidate]) {
    const result = await request(path, { method: 'PATCH', user, headers: { Origin: origin } });
    assert.equal(result.status, 403);
    assert.equal(job.isActive, true);
  }
});

const dateFromNow = hours => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const interviewPayload = () => ({
  applicationId: application.id,
  scheduledAt: dateFromNow(24),
  locationOrLink: meetingUrl,
  interviewerName: 'Test interviewer',
  type: 'ONLINE',
});

test('interview creation rejects malformed or past dates and unsuitable locations', async () => {
  const invalidFields = [
    { scheduledAt: 'tomorrow' },
    { scheduledAt: '2099-02-29T09:00:00.000Z' },
    { scheduledAt: '2099-12-01T24:00:00.000Z' },
    { scheduledAt: dateFromNow(-24) },
    { locationOrLink: 'Room 3' },
    { locationOrLink: 'ftp://meet.example.test' },
    { locationOrLink: 'https:///meet.example.test' },
    { locationOrLink: 'https://meet.example.test:99999' },
    { locationOrLink: 'https://meet.example.test/invalid space' },
    { type: 'OFFLINE', locationOrLink: meetingUrl },
    { type: 'OFFLINE', locationOrLink: '  ' },
    { type: 'OFFLINE', locationOrLink: 'X'.repeat(2001) },
  ];
  for (const fields of invalidFields) {
    const result = await request('/interview', {
      method: 'POST', user: recruiter, body: { ...interviewPayload(), ...fields },
    });
    assert.equal(result.status, 400, JSON.stringify(fields).slice(0, 90));
  }
});

test('interview creation accepts HTTP and HTTPS meetings and physical locations for authorized users', async () => {
  prisma.application = { findUnique: async () => application };
  prisma.interview = {
    findFirst: async () => null,
    create: async ({ data }) => data,
  };

  for (const fields of [
    { type: undefined, locationOrLink: meetingUrl },
    { type: 'online', locationOrLink: 'http://meet.example.test:8080/interview' },
    { type: 'OFFLINE', locationOrLink: '  Floor 5, Meeting Room 301  ' },
  ]) {
    const result = await request('/interview', {
      method: 'POST', user: recruiter, body: { ...interviewPayload(), ...fields },
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.interview.type, fields.type === 'OFFLINE' ? 'OFFLINE' : 'ONLINE');
    assert.equal(result.body.interview.locationOrLink, fields.locationOrLink.trim());
  }

  const forbidden = await request('/interview', {
    method: 'POST', user: otherRecruiter, body: interviewPayload(),
  });
  assert.equal(forbidden.status, 403);
});

function useInterview(overrides = {}) {
  let interview = {
    ...interviewPayload(),
    id: 'interview-1',
    scheduledAt: new Date(dateFromNow(24)),
    status: 'SCHEDULED',
    application,
    ...overrides,
  };
  prisma.interview = {
    findUnique: async () => interview,
    findFirst: async () => null,
    update: async ({ data }) => {
      interview = { ...interview, ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) };
      return interview;
    },
  };
  return (body, user = recruiter) => request('/interview/interview-1', {
    method: 'PUT', user, body,
  });
}

test('interview edits validate the resulting type and location and reject rescheduling into the past', async () => {
  const update = useInterview();
  for (const fields of [
    { scheduledAt: '2099-02-30T09:00:00.000Z' },
    { scheduledAt: dateFromNow(-48) },
    { locationOrLink: 'Room 1' },
    { type: 'OFFLINE' },
  ]) {
    assert.equal((await update(fields)).status, 400, JSON.stringify(fields));
  }

  const newDate = dateFromNow(72);
  const offline = await update({ scheduledAt: newDate, type: 'OFFLINE', locationOrLink: 'Room 301' });
  assert.equal(offline.status, 200);
  assert.equal(offline.body.interview.type, 'OFFLINE');
  assert.equal(offline.body.interview.scheduledAt, newDate);
  assert.equal((await update({ locationOrLink: meetingUrl })).status, 400);
  assert.equal((await update({ type: 'ONLINE' })).status, 400);

  const online = await update({ type: 'ONLINE', locationOrLink: meetingUrl });
  assert.equal(online.status, 200);
  assert.equal(online.body.interview.locationOrLink, meetingUrl);
  assert.equal((await update({ notes: 'Another recruiter' }, otherRecruiter)).status, 403);
});

test('existing past interviews can still be annotated and completed', async () => {
  const scheduledAt = dateFromNow(-24);
  const update = useInterview({ scheduledAt: new Date(scheduledAt), locationOrLink: 'Legacy venue label' });
  assert.equal((await update({ scheduledAt, notes: 'The original time was retained' })).status, 200);
  const done = await update({ status: 'COMPLETED' });
  assert.equal(done.status, 200);
  assert.equal(done.body.interview.status, 'COMPLETED');
  assert.equal(done.body.interview.scheduledAt, scheduledAt);
});

test('dashboard counts only scheduled interviews within each role scope', async () => {
  const interviews = [
    { status: 'SCHEDULED', recruiterId: recruiter.id, userId: candidate.id },
    { status: 'COMPLETED', recruiterId: recruiter.id, userId: candidate.id },
    { status: 'CANCELLED', recruiterId: recruiter.id, userId: candidate.id },
    { status: 'SCHEDULED', recruiterId: recruiter.id, userId: 'candidate-2' },
    { status: 'SCHEDULED', recruiterId: otherRecruiter.id, userId: 'candidate-2' },
    { status: 'SCHEDULED', recruiterId: otherRecruiter.id, userId: candidate.id },
    { status: 'SCHEDULED', recruiterId: otherRecruiter.id, userId: 'candidate-3' },
  ];
  prisma.job = { count: async () => 0 };
  prisma.application = { count: async () => 0, groupBy: async () => [], findMany: async () => [] };
  const queries = [];
  prisma.interview = {
    count: async ({ where }) => {
      queries.push(where);
      return interviews.filter(interview =>
        (!where.status || interview.status === where.status) &&
        (!where.application?.job || interview.recruiterId === where.application.job.recruiterId) &&
        (!where.application?.candidateProfile || interview.userId === where.application.candidateProfile.userId)
      ).length;
    },
  };

  for (const [user, expected] of [[recruiter, 2], [candidate, 2], [admin, 5]]) {
    const result = await request('/dashboard', { user });
    assert.equal(result.status, 200);
    assert.equal(result.body.summary.scheduledInterviews, expected);
  }
  assert.deepEqual(queries, [
    { status: 'SCHEDULED', application: { job: { recruiterId: recruiter.id } } },
    { status: 'SCHEDULED', application: { candidateProfile: { userId: candidate.id } } },
    { status: 'SCHEDULED', application: {} },
  ]);
});

test('job creates and edits use the same trimmed 5000-character title limit', async () => {
  let job = { id: 'job-1', recruiterId: recruiter.id };
  prisma.company = { findFirst: async () => ({ id: 'company-1' }) };
  prisma.job = {
    findUnique: async () => job,
    create: async ({ data }) => (job = { ...job, ...data }),
    update: async ({ data }) => (job = { ...job, ...data }),
  };

  const fields = { companyName: 'Test Company', location: 'Hanoi', description: 'Description', requirements: 'Requirements' };
  for (const [method, path, successStatus] of [['POST', '/job/create', 201], ['PUT', '/job/manage/job-1', 200]]) {
    const invalid = await request(path, { method, user: recruiter, body: { ...fields, title: 'X'.repeat(5001) } });
    assert.equal(invalid.status, 400);
    const valid = await request(path, { method, user: recruiter, body: { ...fields, title: ' ' + 'X'.repeat(5000) + ' ' } });
    assert.equal(valid.status, successStatus);
    assert.equal(valid.body.job.title.length, 5000);
  }
});
