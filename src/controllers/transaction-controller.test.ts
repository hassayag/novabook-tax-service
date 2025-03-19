import { Request } from 'express'
import { postTransaction } from './transaction-controller'
import { TransactionService } from '../services/transaction-service'
import { InvoiceService } from '../services/invoice-service'
import { BadRequestError, ConflictError } from '../lib/errors'
import { ZodError } from 'zod'

jest.mock('../db')

describe('Controller test suite', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /transactions', () => {
        let getInvoice: jest.SpyInstance
        let createSaleSpy: jest.SpyInstance
        let createPaymentSpy: jest.SpyInstance

        beforeEach(() => {
            getInvoice = jest.spyOn(InvoiceService['prototype'], 'getInvoice').mockImplementation()
            createSaleSpy = jest
                .spyOn(TransactionService['prototype'], 'createSale')
                .mockImplementation()
            createPaymentSpy = jest
                .spyOn(TransactionService['prototype'], 'createPayment')
                .mockImplementation()
        })

        describe('SALES event type', () => {
            const req = {
                body: {
                    eventType: 'SALES',
                    invoiceId: 'fdc96c93-5544-4968-8e70-61f6e3a47610',
                    date: '2022-01-01',
                    items: [
                        {
                            itemId: '25fa03b4-3b6f-44c7-92eb-d48ce24e6ce3',
                            cost: 4999,
                            taxRate: 0.2,
                        },
                    ],
                },
            } as Request

            test('Sale event will create a sale', async () => {
                await expect(postTransaction(req)).resolves.toEqual(undefined)

                expect(createSaleSpy).toHaveBeenCalledTimes(1)
                expect(createSaleSpy).toHaveBeenCalledWith({
                    invoiceId: 'fdc96c93-5544-4968-8e70-61f6e3a47610',
                    date: new Date('2022-01-01'),
                    items: [
                        {
                            itemId: '25fa03b4-3b6f-44c7-92eb-d48ce24e6ce3',
                            cost: 4999,
                            taxRate: 0.2,
                        },
                    ],
                })

                expect(createPaymentSpy).toHaveBeenCalledTimes(0)
            })

            test('If invoice exists, throw ConflictError', async () => {
                getInvoice.mockResolvedValue({
                    id: 'fdc96c93-5544-4968-8e70-61f6e3a47610',
                    date: '2022-01-01',
                })

                await expect(postTransaction(req)).rejects.toThrow(ConflictError)

                expect(createSaleSpy).toHaveBeenCalledTimes(0)
                expect(createPaymentSpy).toHaveBeenCalledTimes(0)
            })

            test('Missing body attribute will throw ZodError', async () => {
                await expect(
                    postTransaction({
                        body: {
                            ...req.body,
                            date: undefined,
                        },
                    } as Request)
                ).rejects.toThrow(ZodError)

                expect(createSaleSpy).toHaveBeenCalledTimes(0)
                expect(createPaymentSpy).toHaveBeenCalledTimes(0)
            })
        })

        describe('TAX_PAYMENT event type', () => {
            const req = {
                body: {
                    eventType: 'TAX_PAYMENT',
                    amount: 2500,
                    date: '2022-01-01',
                },
            } as Request

            test('Tax payment event will create a payment', async () => {
                await expect(postTransaction(req)).resolves.toEqual(undefined)

                expect(createSaleSpy).toHaveBeenCalledTimes(0)
                expect(createPaymentSpy).toHaveBeenCalledTimes(1)
                expect(createPaymentSpy).toHaveBeenCalledWith({
                    amount: 2500,
                    date: new Date('2022-01-01'),
                })
            })

            test('Missing body attribute will throw ZodError', async () => {
                await expect(
                    postTransaction({
                        body: {
                            ...req.body,
                            date: undefined,
                        },
                    } as Request)
                ).rejects.toThrow(ZodError)

                expect(createSaleSpy).toHaveBeenCalledTimes(0)
                expect(createPaymentSpy).toHaveBeenCalledTimes(0)
            })
        })

        test('If eventType is invalid, throw BadRequestError', async () => {
            await expect(
                postTransaction({
                    body: {
                        eventType: 'BAD_EVENT_TYPE',
                    },
                } as Request)
            ).rejects.toThrow(BadRequestError)

            expect(createSaleSpy).toHaveBeenCalledTimes(0)
            expect(createPaymentSpy).toHaveBeenCalledTimes(0)
        })
    })
})
