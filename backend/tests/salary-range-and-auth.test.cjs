const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const jwt = require('jsonwebtoken');

const backendSalary = require('../dist/utils/salary-range.js');
const { getJwtSecret, JwtSecretConfigurationError } = require('../dist/utils/jwt-secret.js');
const { requireAuth } = require('../dist/middlewares/auth.middleware.js');

const frontendSalarySource = fs.readFileSync(
  path.resolve(__dirname, '../../frontend/src/utils/salaryRange.ts'),
  'utf8'
);
const frontendSalaryModule = { exports: {} };
const frontendSalaryCode = ts.transpileModule(frontendSalarySource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('module', 'exports', frontendSalaryCode)(frontendSalaryModule, frontendSalaryModule.exports);
const frontendSalary = frontendSalaryModule.exports;

const withJwtSecret = (value, callback) => {
  const previous = process.env.JWT_SECRET;
  if (value === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = value;

  try {
    callback();
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
};

test('accepts supported salary ranges and Negotiable consistently in frontend and backend', () => {
  const validValues = [
    '',
    'Negotiable',
    'negotiable',
    '15M - 25M',
    '1.5B - 2B',
    '1,000 - 2,000',
    ' 15M - 25M ',
    '9007199254740992 - 9007199254740993',
  ];

  for (const value of validValues) {
    assert.equal(backendSalary.validateSalaryRange(value), null, value);
    assert.equal(frontendSalary.validateSalaryRange(value), null, value);
  }
});

test('rejects malformed, descending, mixed-unit, and overlong salary ranges consistently', () => {
  const invalidValues = [
    '15M to 25M',
    '25M - 15M',
    '9007199254740993 - 9007199254740992',
    '15M - 25K',
    '10.123M - 20M',
    `${'x'.repeat(101)}`,
  ];

  for (const value of invalidValues) {
    assert.ok(backendSalary.validateSalaryRange(value), value);
    assert.equal(frontendSalary.validateSalaryRange(value), backendSalary.validateSalaryRange(value));
  }
});

test('update parser distinguishes omitted salary from clearing it', () => {
  assert.deepEqual(backendSalary.parseSalaryRangeUpdate({}), { present: false });
  assert.deepEqual(backendSalary.parseSalaryRangeUpdate({ salaryRange: '   ' }), { present: true, value: null });
  assert.deepEqual(backendSalary.parseSalaryRangeUpdate({ salaryRange: 'Negotiable' }), { present: true, value: 'Negotiable' });
  assert.deepEqual(backendSalary.parseSalaryRangeUpdate({ salaryRange: 'bad format' }), {
    present: true,
    error: 'Enter a range such as "15M - 25M", or use "Negotiable".',
  });
  assert.deepEqual(backendSalary.parseSalaryRangeUpdate({ salaryRange: null }), {
    present: true,
    error: 'Salary range must be text. Send an empty string to clear it.',
  });
});

test('JWT secret must be present and at least 32 characters without exposing its value', () => {
  withJwtSecret(undefined, () => {
    assert.throws(() => getJwtSecret(), JwtSecretConfigurationError);
  });
  withJwtSecret('too-short', () => {
    assert.throws(() => getJwtSecret(), JwtSecretConfigurationError);
  });
  withJwtSecret(`test-only-${'x'.repeat(32)}`, () => {
    assert.equal(getJwtSecret(), `test-only-${'x'.repeat(32)}`);
  });
});

test('JWT signing and verification use the same validated secret', () => {
  withJwtSecret(`test-only-${'x'.repeat(32)}`, () => {
    const token = jwt.sign({ id: 'test-user' }, getJwtSecret());
    assert.equal(jwt.verify(token, getJwtSecret()).id, 'test-user');
  });
});

test('authentication middleware reports missing JWT configuration as a server error', () => {
  withJwtSecret(undefined, () => {
    const response = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    const previousConsoleError = console.error;
    console.error = () => {};

    try {
      requireAuth({ headers: { authorization: 'Bearer test-token' } }, response, () => {
        assert.fail('Authentication must not continue without a JWT secret.');
      });
    } finally {
      console.error = previousConsoleError;
    }

    assert.equal(response.statusCode, 500);
    assert.equal(response.body.message, 'Server authentication is not configured.');
  });
});
