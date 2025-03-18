export abstract class BaseError extends Error {
    abstract status: number
}

export class BadRequestError extends BaseError {
    status = 400
}

export class NotFoundError extends BaseError {
    status = 404
}

export class ConflictError extends BaseError {
    status = 409
}
