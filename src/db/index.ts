import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from "../config";
import { Items, Invoices } from './schemas';

const { host, port, name, user, password } = config.db
export const db =  drizzle({
    connection: {
        host,
        port,
        database: name,
        user,
        password,
    },
    schema: {
        items: Items,
        invoices: Invoices,
    },
});
