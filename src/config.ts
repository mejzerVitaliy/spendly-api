import 'dotenv/config';

type EnvironmentVariables = {
  HOST: string;
  PORT: number;
  DATABASE_URL: string;
  APPLICATION_URL: string;
  FRONTEND_URL: string;
  DOCS_PASSWORD: string;
  APPLICATION_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  RESEND_API_KEY: string;
  OPENAI_API_KEY: string;
};

const environmentVariables: EnvironmentVariables = {
  HOST: process.env.HOST || '0.0.0.0',
  PORT: process.env.PORT ? Number(process.env.PORT) : 5000,
  DATABASE_URL: process.env.DATABASE_URL!,
  APPLICATION_URL: process.env.APPLICATION_URL!,
  FRONTEND_URL: process.env.FRONTEND_URL!,
  DOCS_PASSWORD: process.env.DOCS_PASSWORD || 'password',
  APPLICATION_SECRET: process.env.APPLICATION_SECRET!,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
};

export { environmentVariables };
export type { EnvironmentVariables };
