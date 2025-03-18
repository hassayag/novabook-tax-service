import express, {Request, Response, NextFunction} from 'express'
import { ZodError } from 'zod'
import bodyParser from 'body-parser'
import { config } from './config'
import { getTaxPosition, patchSale, postTransaction } from './controller'
import { BaseError } from './errors'

const start = () => {
    const app = express()
    app.use(bodyParser.json())

    app.post('/transactions', postTransaction)
    app.get('/tax-position', getTaxPosition)
    app.patch('/sale', patchSale)
    
    app.use((err: Error | BaseError | ZodError, req: Request, res: Response, next: NextFunction) => {
        console.error(err)
        if (err instanceof ZodError) {
            res.status(400).json({message: err.flatten()})
        }
        else if (err instanceof BaseError) {
            res.status(err.status).json({message: err.message})
        }
        else {
            res.status(500).json({message: 'Something went wrong!'})
        }
    })

    app.listen(config.port, () => {
        console.log(`Listening on port ${config.port}`)
    })
}

start()
