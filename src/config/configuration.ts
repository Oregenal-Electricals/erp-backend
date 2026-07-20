export default () => ({
  port: parseInt(process.env.PORT || '3001', 10) || 3001,
  environment: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  app: {
    name: process.env.APP_NAME || 'ERP Manufacturing',
    version: process.env.APP_VERSION || '1.0.0',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
