export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  isDev: process.env.NODE_ENV !== 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  redis: {
    url: process.env.REDIS_URL || '',
  },
  
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucket: process.env.MINIO_BUCKET || 'frankdrive-files',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || '',
  },
  
  session: {
    secret: process.env.SESSION_SECRET || '',
  },
};
