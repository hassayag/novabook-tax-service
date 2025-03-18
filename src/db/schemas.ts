import { pgTable, text, timestamp, integer, numeric, primaryKey } from 'drizzle-orm/pg-core'

export type Invoice = {
    id: string
    date: Date
}

export const Invoices = pgTable('invoices', {
    id: text().primaryKey(),
    date: timestamp().notNull(),
})

export type Item = {
    id: string
    invoiceId: string
    /** in pennies */
    cost: number
    /** decimal between 0 and 1 */
    taxRate: number
    date: Date
}

export const Items = pgTable(
    'items',
    {
        id: text().notNull(),
        date: timestamp().notNull(),
        invoiceId: text().references(() => Invoices.id, {
            onDelete: 'cascade',
        }),
        cost: integer().notNull(),
        taxRate: numeric().notNull(),
    },
    (table) => [primaryKey({ columns: [table.id, table.date] })]
)

export type Payment = {
    id: string
    /** in pennies */
    amount: number
    date: Date
}

export const Payments = pgTable('payments', {
    id: text().primaryKey(),
    amount: integer().notNull(),
    date: timestamp().notNull(),
})
