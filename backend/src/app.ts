import express from 'express'
import 'dotenv/config'
import './config/passport.js'
import authRouter from './routes/auth.js';
import flightRouter from './routes/flights.js';

const app = express();

app.use(express.json())
app.use('/auth',authRouter)
app.use('/flights',flightRouter)

app.get("/", (req, res) => {
    res.send("Hello World")
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})