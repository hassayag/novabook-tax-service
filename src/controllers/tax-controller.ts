import { lte, desc } from 'drizzle-orm'
import { Request } from 'express'
import z from 'zod'
import { db } from '../db'
import { Items, Payments } from '../db/schemas'

const getTaxSchema = z.object({
    query: z.object({
        date: z.string().date(),
    }),
})

export async function getTaxPosition(req: Request) {
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
    return { date: endDate, taxPosition: taxPositionInPounds.toFixed(2) }
}
