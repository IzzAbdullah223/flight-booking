import type Stripe from 'stripe'
import { prisma } from '../db/prisma.js'
import { stripe } from '../config/stripe.js'
import * as flightService from './flightService.js'
import { AppError } from '../utils/Apperror.js'

 
export async function createPaymentIntent(userId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, userId },
        include: { flight: true, payment: true },
    })
    if (!booking) throw new AppError('BOOKING_NOT_FOUND', 404, 'Booking not found')
    if (booking.status !== 'PENDING') {
        throw new AppError('INVALID_BOOKING_STATE', 400, 'This booking is not awaiting payment')
    }

 
    if (booking.payment?.stripePaymentIntentId) {
        const existing = await stripe.paymentIntents.retrieve(booking.payment.stripePaymentIntentId)
        if (existing.status !== 'canceled') {
            return { clientSecret: existing.client_secret, paymentIntentId: existing.id }
        }
    }

    const amount = Number(booking.flight.price) * booking.seats
    const amountInCents = Math.round(amount * 100)

    const intent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: { bookingId: booking.id },
    })

    await prisma.payment.upsert({
        where: { bookingId: booking.id },
        create: { bookingId: booking.id, stripePaymentIntentId: intent.id, amount, status: 'PENDING' },
        update: { stripePaymentIntentId: intent.id, amount, status: 'PENDING' },
    })

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id }
}

 
export async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
    const bookingId = intent.metadata.bookingId
    if (!bookingId) return

    await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({ where: { bookingId } })
        if (!payment) return
        if (payment.status === 'SUCCEEDED') return // already processed - duplicate delivery

        await tx.payment.update({ where: { bookingId }, data: { status: 'SUCCEEDED' } })
        await tx.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } })
    })
}

 
export async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
    const bookingId = intent.metadata.bookingId
    if (!bookingId) return

    await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({ where: { bookingId }, include: { booking: true } })
        if (!payment) return
        if (payment.status === 'FAILED' || payment.status === 'SUCCEEDED') return // already handled

        await tx.payment.update({ where: { bookingId }, data: { status: 'FAILED' } })
        await tx.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
        await flightService.releaseSeats(tx, payment.booking.flightId, payment.booking.seats)
    })
}