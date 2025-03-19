import { eq } from 'drizzle-orm'
import { db } from '../db'
import { Invoices } from '../db/schemas'

export class InvoiceService {
    async getInvoice(id: string) {
        return db.query.invoices.findFirst({
            where: eq(Invoices.id, id),
        })
    }
}
