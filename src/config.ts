import { z } from 'zod'

const configSchema = z.object({
    port: z.number(),
    db: z.object({
        host: z.string(),
        port: z.number(),
        name: z.string(),
        user: z.string(),
        password: z.string(),
    }),
})

export const config = configSchema.parse({
    port: Number(process.env.PORT) ?? 5000,
    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) ?? 5432,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
})
