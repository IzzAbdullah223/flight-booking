import { Router } from 'express'
import express from 'express'
import { verifyToken } from '../controllers/authController.js'
import { createPaymentIntentPost, stripeWebhookPost } from '../controllers/paymentController.js'

const paymentRouter = Router()

 
paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhookPost)

paymentRouter.post('/create-intent', verifyToken, createPaymentIntentPost)

export default paymentRouter