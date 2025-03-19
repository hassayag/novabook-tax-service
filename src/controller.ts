import { NextFunction, Request, Response } from 'express'
import { and, eq, lte, desc } from 'drizzle-orm'
import z from 'zod'
import { db } from './db'
import { Invoices, Items, Payments } from './db/schemas'
import { BadRequestError, ConflictError, NotFoundError } from './errors'
import { TransactionService } from './services/transaction-service'
import { InvoiceService } from './services/invoice-service'

const postSalesTransactionSchema = z.object({
    body: z.object({
        eventType: z.literal('SALES'),
        invoiceId: z.string().uuid(),
        date: z.string(),
        items: z.array(
            z.object({
                itemId: z.string().uuid(),
                cost: z.number(),
                taxRate: z.number(),
            })
        ),
    }),
})

const postPaymentTransactionSchema = z.object({
    body: z.object({
        eventType: z.literal('TAX_PAYMENT'),
        amount: z.number(),
        date: z.string(),
    }),
})

export async function postTransaction(req: Request) {
    const transactionService = new TransactionService()
    const invoiceService = new InvoiceService()

    if (req.body.eventType === 'SALES') {
        const { body } = postSalesTransactionSchema.parse(req)

        const invoice = await invoiceService.getInvoice(body.invoiceId)
        if (invoice) {
            throw new ConflictError(`Invoice with id ${body.invoiceId} already exists`)
        }

        await transactionService.createSale({
            invoiceId: body.invoiceId,
            date: new Date(body.date),
            items: body.items,
        })
    } else if (req.body.eventType === 'TAX_PAYMENT') {
        const { body } = postPaymentTransactionSchema.parse(req)

        await transactionService.createPayment({ amount: body.amount, date: new Date(body.date) })
    } else {
        throw new BadRequestError(`Unknown event type ${req.body.eventType}`)
    }
}

const getTaxSchema = z.object({
    query: z.object({
        date: z.string().date(),
    }),
})

export async function getTaxPosition(req: Request, res: Response, next: NextFunction) {
    try {
        const event = getTaxSchema.parse(req)
        const endDate = new Date(event.query.date)

        let totalTax = 0
        // sort descending by date to always get the latest item costs first
        const items = await db
            .select()
            .from(Items)
            .where(lte(Items.date, new Date(endDate)))
            .orderBy(desc(Items.date))

        // track used item ids to prevent duplication across different dates
        const usedItemIds = new Set()
        items.forEach((item) => {
            if (usedItemIds.has(item.id)) {
                return
            }
            usedItemIds.add(item.id)
            totalTax += item.cost * Number(item.taxRate)
        })

        let paidTax = 0
        const payments = await db
            .select()
            .from(Payments)
            .where(lte(Payments.date, new Date(endDate)))
        payments.forEach((payment) => (paidTax += payment.amount))

        const taxPositionInPounds = (totalTax - paidTax) / 100
        res.send({ date: endDate, taxPosition: taxPositionInPounds.toFixed(2) })
    } catch (err) {
        next(err)
    }
}

const patchSaleSchema = z.object({
    body: z.object({
        invoiceId: z.string().uuid(),
        itemId: z.string().uuid(),
        cost: z.number(),
        taxRate: z.number(),
        date: z.string(),
    }),
})

export async function patchSale(req: Request, res: Response, next: NextFunction) {
    try {
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

        res.status(202).send()
    } catch (err) {
        next(err)
    }
}
