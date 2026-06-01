export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
