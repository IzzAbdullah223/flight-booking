import { Router } from 'express'
import passport from 'passport'
import { signUpPost, logInPost } from '../controllers/authController.js'
import { refreshTokenPost, logoutPost } from '../controllers/refreshTokenController.js'

const authRouter = Router()

authRouter.post('/signup', signUpPost)
authRouter.post('/login', passport.authenticate('local', { session: false }), logInPost)
authRouter.post('/refresh', refreshTokenPost)
authRouter.post('/logout', logoutPost)

export default authRouter