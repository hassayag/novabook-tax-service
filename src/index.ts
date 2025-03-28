import express, { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { fromError } from 'zod-validation-error'
import bodyParser from 'body-parser'
import { config } from './config'
import { BaseError } from './lib/errors'
import { postTransaction } from './controllers/transaction-controller'
import { patchSale } from './controllers/sale-controller'
import { getTaxPosition } from './controllers/tax-controller'

const start = () => {
    const app = express()
    app.use(bodyParser.json())

    app.post('/transactions', async (req, res, next) => {
        try {
            await postTransaction(req)
            res.status(202).send()
        } catch (err) {
            next(err)
        }
    })

    app.get('/tax-position', async (req, res, next) => {
        try {
            const taxPosition = await getTaxPosition(req)
            res.status(200).send(taxPosition)
        } catch (err) {
            next(err)
        }
    })

    app.patch('/sale', async (req, res, next) => {
        try {
            await patchSale(req)
            res.status(202).send()
        } catch (err) {
            next(err)
        }
    })

    app.use(
        (err: Error | BaseError | ZodError, req: Request, res: Response, next: NextFunction) => {
            console.error('Error occurred -', err)
            if (err instanceof ZodError) {
                const formattedError = fromError(err)

                res.status(400).json({ message: formattedError })
            } else if (err instanceof BaseError) {
                res.status(err.status).json({ message: err.message })
            } else {
                res.status(500).json({ message: 'Something went wrong!' })
            }
        }
    )

    app.listen(config.port, () => {
        console.log(`Listening on port ${config.port}`)
    })
}

start()
