import express from 'express'
import 'dotenv/config'
import './config/passport.js'
import authRouter from './routes/auth.js';
import flightRouter from './routes/flights.js';
import paymentRouter from './routes/payments.js';
import bookingRouter from './routes/bookings.js';

const app = express();
app.use('/payments', paymentRouter)   
app.use(express.json())
app.use('/auth',authRouter)
app.use('/flights',flightRouter)
app.use('/booking',bookingRouter)

app.get("/", (req, res) => {
    res.send("Hello World")
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})