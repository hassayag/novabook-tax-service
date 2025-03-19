import { defineConfig } from 'drizzle-kit'
import { config } from './src/config'

const { host, name, port, user, password } = config.db

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/db/schemas.ts',
    dbCredentials: {
        host,
        database: name,
        port,
        user,
        password,
        ssl: false,
    },
    migrations: {
        schema: 'public',
    },
})
