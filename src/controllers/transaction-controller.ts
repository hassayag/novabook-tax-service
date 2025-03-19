import { NextFunction, Request, Response } from 'express'
import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '../db'
import { Invoices, Items, Payments } from '../db/schemas'
import { BadRequestError, ConflictError } from '../lib/errors'
import { TransactionService } from '../services/transaction-service'
import { InvoiceService } from '../services/invoice-service'

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
