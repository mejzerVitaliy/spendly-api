type EnvironmentVariables = {
    HOST: string,
    PORT: number,
    DATABASE_URL: string,
    APPLICATION_URL: string,
    FRONTEND_URL: string,
    DOCS_PASSWORD: string,
    APPLICATION_SECRET: string
}

const environmentVariables: EnvironmentVariables = {
    HOST: process.env.HOST || '0.0.0.0',
    PORT: process.env.PORT ? Number(process.env.PORT) : 5000,
    DATABASE_URL: process.env.DATABASE_URL!,
    APPLICATION_URL: process.env.APPLICATION_URL!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    DOCS_PASSWORD: process.env.DOCS_PASSWORD || 'password',
    APPLICATION_SECRET: process.env.APPLICATION_SECRET!
}

export {environmentVariables};
export type {EnvironmentVariables};