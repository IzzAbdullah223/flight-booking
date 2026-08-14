import { Router } from 'express'
import passport from 'passport'
import { signUpPost, logInPost } from '../controllers/authController.js'

const authRouter = Router()


authRouter.post('/signup', signUpPost)
authRouter.post('/login', passport.authenticate('local', { session: false }), logInPost)

export default authRouter