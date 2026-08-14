import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import './config/passport.js'
import authRouter from './routes/auth.js';
import flightRouter from './routes/flights.js';
import paymentRouter from './routes/payments.js';
import bookingRouter from './routes/bookings.js';
import { stripeWebhookPost } from './controllers/paymentController.js';

const app = express();

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
}));
app.use(cookieParser());

app.post('/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhookPost);

app.use(express.json())

app.use('/auth', authRouter)
app.use('/flights', flightRouter)
app.use('/bookings', bookingRouter)
app.use('/payments', paymentRouter)  

app.get("/", (req, res) => {
    res.send("Hello World")
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})