
export class AppError extends Error {
    statusCode: number
    code: string

    constructor(code: string, statusCode: number, message: string) {
        super(message)
        this.name = 'AppError'
        this.code = code
        this.statusCode = statusCode
    }
}