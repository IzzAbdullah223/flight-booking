import { type Request, type Response } from 'express'
import type Stripe from 'stripe'
import { z } from 'zod'
import { stripe } from '../config/stripe.js'
import * as paymentService from '../services/paymentService.js'
import { AppError } from '../utils/Apperror.js'

const createIntentSchema = z.object({ bookingId: z.string().uuid() })

export async function createPaymentIntentPost(req: Request, res: Response) {
    const result = createIntentSchema.safeParse(req.body)
    if (!result.success) return res.status(400).json({ error: 'Invalid request', details: result.error.flatten() })

    const userId = req.user!.id
    try {
        const { clientSecret } = await paymentService.createPaymentIntent(userId, result.data.bookingId)
        res.json({ clientSecret })
    } catch (err) {
        if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message })
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
}

export async function stripeWebhookPost(req: Request, res: Response) {
    const signature = req.headers['stripe-signature']
    if (!signature) return res.status(400).send('Missing stripe-signature header')

    let event: Stripe.Event
    try {
  
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return res.status(400).send('Invalid signature')
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await paymentService.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
                break
            case 'payment_intent.payment_failed':
                await paymentService.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
                break
            default:
                break 
        }
        res.json({ received: true })
    } catch (err) {
        console.error('Webhook handler error:', err)
        res.status(500).json({ error: 'Webhook handler failed' })
    }
}