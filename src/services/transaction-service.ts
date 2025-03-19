import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { Invoices, Items, Payments } from '../db/schemas'

type CreateSaleOptions = {
    invoiceId: string
    date: Date
    items: {
        itemId: string
        cost: number
        taxRate: number
    }[]
}

type CreatePaymentOptions = {
    amount: number
    date: Date
}

export class TransactionService {
    async createSale({ invoiceId, date, items }: CreateSaleOptions) {
        await db.transaction(async (transaction) => {
            await transaction.insert(Invoices).values({
                id: invoiceId,
                date: new Date(date),
            })

            await transaction.insert(Items).values(
                items.map((item) => ({
                    id: item.itemId,
                    invoiceId: invoiceId,
                    cost: item.cost,
                    taxRate: item.taxRate.toString(),
                    date: new Date(date),
                }))
            )
        })
    }

    async createPayment({ amount, date }: CreatePaymentOptions) {
        await db.insert(Payments).values({
            id: uuidv4(),
            amount: amount,
            date: new Date(date),
        })
    }
}
