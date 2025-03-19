import { and, eq } from 'drizzle-orm'
import { Request } from 'express'
import z from 'zod'
import { db } from '../db'
import { Invoices, Items } from '../db/schemas'
import { BadRequestError } from '../lib/errors'

const patchSaleSchema = z.object({
    body: z.object({
        invoiceId: z.string().uuid(),
        itemId: z.string().uuid(),
        cost: z.number(),
        taxRate: z.number(),
        date: z.string(),
    }),
})

export async function patchSale(req: Request) {
    const { body } = patchSaleSchema.parse(req)

    let invoice = await db.query.invoices.findFirst({
        where: eq(Invoices.id, body.invoiceId),
    })

    if (!invoice) {
        invoice = (
            await db
                .insert(Invoices)
                .values({
                    id: body.invoiceId,
                    date: new Date(body.date),
                })
                .returning()
        )[0]
    }

    // create item if no record found at that particular date
    const item = await db.query.items.findFirst({
        where: and(eq(Items.id, body.itemId), eq(Items.date, new Date(body.date))),
    })

    // invoiceId cannot not be modified
    if (item && item.invoiceId !== invoice?.id) {
        throw new BadRequestError(`Item already belongs to invoice with ID ${item.invoiceId}`)
    }

    if (!item) {
        await db.insert(Items).values({
            id: body.itemId,
            invoiceId: body.invoiceId,
            cost: body.cost,
            taxRate: body.taxRate.toString(),
            date: new Date(body.date),
        })
    } else {
        await db
            .update(Items)
            .set({ cost: body.cost, taxRate: body.taxRate.toString() })
            .where(and(eq(Items.id, body.itemId), eq(Items.date, new Date(body.date))))
    }
}
