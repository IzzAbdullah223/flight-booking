import { type Request, type Response, type NextFunction } from 'express'

export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" })
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" })
        }
        next()
    }
}