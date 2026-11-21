const MIN_JWT_SECRET_LENGTH = 32;

export class JwtSecretConfigurationError extends Error {
  constructor() {
    super('JWT_SECRET must be configured with at least 32 characters.');
    this.name = 'JwtSecretConfigurationError';
  }
}

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new JwtSecretConfigurationError();
  }

  return secret;
};
