import {type Response, type Request, type NextFunction} from 'express'
import jwt,{type JwtPayload, type Secret} from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma.js'
import { signUpSchema } from '../schemas/authSchemas.js'

declare global{
    namespace Express{
        interface Request{
            token?: string | undefined
        }
    }
}

interface TokenPayload{
    user:{
        id: string
        email: string
        role: string
        name: string
    }
}

export async function signUpPost(req: Request, res: Response) {
    const body: unknown = req.body
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
        return res.status(400).json({ success: "Failed to create account" })
    }
    const existingUser = await prisma.user.findUnique({
        where:{email:result.data.email}
    })
    if (existingUser) {
        return res.status(400).json({ errors: { Email: "Email already exists" } })
    }
    const hashedPassword = await bcrypt.hash(result.data.password, 10)

    const newUser = await prisma.user.create({
        data:{
            name:result.data.name,
            email:result.data.email,
            password:hashedPassword
        }
    })

    jwt.sign(
        { user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name } },
        process.env.SECRET_KEY as Secret,
        { expiresIn: '24h' },
        (err, token) => {
            res.json({ token, currentUserId: newUser.id })
        }
    )
}

export async function logInPost(req: Request, res: Response) {
    const user = req.user
    jwt.sign(
        { user: { id: user?.id, email: user?.email, role: user?.role, name: user?.name } },
        process.env.SECRET_KEY as Secret,
        { expiresIn: '24h' },
        (err, token) => {
            res.json({ token, currentUserId: user?.id, name: user?.name})
        }
    )
}

export function verifyToken(req: Request, res: Response, next: NextFunction){
    const bearerHeader = req.headers['authorization']

    if(typeof(bearerHeader) !== 'undefined'){
        const bearer = bearerHeader.split(' ')
        const bearerToken = bearer[1]

        if(!bearerToken){
            return res.status(403).json({error: "Invalid token format"})
        }

        jwt.verify(bearerToken, process.env.SECRET_KEY as Secret, (err: Error | null, authData: string | JwtPayload | undefined) => {
            if(err){
                return res.status(403).json({error: "Invalid or expired token"})
            }

            const payload = authData as TokenPayload
            req.token = bearerToken
            req.user = payload.user
            next()
        })
    }
    else{
        res.status(403).json({error: "No token provided"})
    }
}