import { type Request, type Response } from 'express'
import jwt, { type Secret } from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../db/prisma.js'

export async function issueRefreshToken(userId: string) {
    const token = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
        data: { token, userId, expiresAt }
    })
    return token
}

export async function refreshTokenPost(req: Request, res: Response) {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ error: "No refresh token" })

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
        return res.status(403).json({ error: "Invalid or expired refresh token" })
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } })
    if (!user) return res.status(403).json({ error: "User not found" })

    jwt.sign(
        { user: { id: user.id, email: user.email, role: user.role, name: user.name } },
        process.env.SECRET_KEY as Secret,
        { expiresIn: '15m' },
        (err, token) => {
            res.json({ token })
        }
    )
}

export async function logoutPost(req: Request, res: Response) {
    const { refreshToken } = req.body
    if (refreshToken) {
        await prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: { revoked: true }
        })
    }
    res.status(200).json({ message: "Logged out" })
}