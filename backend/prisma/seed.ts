import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/db/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function daysFromNow(days: number, hour: number, minute = 0) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + days)
    d.setUTCHours(hour, minute, 0, 0)
    return d
}

async function main() {
 
    const adminPassword = await bcrypt.hash('AdminPass123', 10)
    const userPassword = await bcrypt.hash('UserPass123', 10)

    await prisma.user.upsert({
        where: { email: 'admin@jadwelny.test' },
        update: {},
        create: { email: 'admin@jadwelny.test', password: adminPassword, name: 'Admin User', role: 'ADMIN' },
    })

    await prisma.user.upsert({
        where: { email: 'user@jadwelny.test' },
        update: {},
        create: { email: 'user@jadwelny.test', password: userPassword, name: 'Test User', role: 'CUSTOMER' },
    })

 
    const flights = [
        { flightNumber: 'EK201', airline: 'Emirates', origin: 'Dubai', destination: 'London', departureTime: daysFromNow(3, 9), arrivalTime: daysFromNow(3, 14), price: 650.0, totalSeats: 180 },
        { flightNumber: 'EK202', airline: 'Emirates', origin: 'London', destination: 'Dubai', departureTime: daysFromNow(3, 22), arrivalTime: daysFromNow(4, 8), price: 640.0, totalSeats: 180 },
        { flightNumber: 'EY101', airline: 'Etihad', origin: 'Abu Dhabi', destination: 'New York', departureTime: daysFromNow(2, 1), arrivalTime: daysFromNow(2, 12), price: 980.0, totalSeats: 220 },
        { flightNumber: 'EY102', airline: 'Etihad', origin: 'New York', destination: 'Abu Dhabi', departureTime: daysFromNow(5, 23), arrivalTime: daysFromNow(6, 20), price: 960.0, totalSeats: 220 },
        { flightNumber: 'QR305', airline: 'Qatar Airways', origin: 'Doha', destination: 'Dubai', departureTime: daysFromNow(1, 7), arrivalTime: daysFromNow(1, 8, 30), price: 210.0, totalSeats: 150 },
        { flightNumber: 'QR306', airline: 'Qatar Airways', origin: 'Dubai', destination: 'Doha', departureTime: daysFromNow(1, 19), arrivalTime: daysFromNow(1, 20, 30), price: 205.0, totalSeats: 150 },
        { flightNumber: 'BA107', airline: 'British Airways', origin: 'London', destination: 'Dubai', departureTime: daysFromNow(4, 10), arrivalTime: daysFromNow(4, 21), price: 700.0, totalSeats: 200 },
        { flightNumber: 'AF220', airline: 'Air France', origin: 'Paris', destination: 'Dubai', departureTime: daysFromNow(6, 11), arrivalTime: daysFromNow(6, 20), price: 610.0, totalSeats: 190 },
        { flightNumber: 'LH330', airline: 'Lufthansa', origin: 'Frankfurt', destination: 'Dubai', departureTime: daysFromNow(7, 8), arrivalTime: daysFromNow(7, 17), price: 590.0, totalSeats: 190 },
        { flightNumber: 'TK410', airline: 'Turkish Airlines', origin: 'Istanbul', destination: 'Dubai', departureTime: daysFromNow(2, 14), arrivalTime: daysFromNow(2, 19), price: 340.0, totalSeats: 160 },
        { flightNumber: 'SQ501', airline: 'Singapore Airlines', origin: 'Singapore', destination: 'Dubai', departureTime: daysFromNow(8, 2), arrivalTime: daysFromNow(8, 7), price: 720.0, totalSeats: 210 },
        { flightNumber: 'DL880', airline: 'Delta', origin: 'New York', destination: 'London', departureTime: daysFromNow(3, 18), arrivalTime: daysFromNow(4, 6), price: 480.0, totalSeats: 200 },
        { flightNumber: 'EK999', airline: 'Emirates', origin: 'Dubai', destination: 'Tokyo', departureTime: daysFromNow(5, 3), arrivalTime: daysFromNow(5, 16), price: 890.0, totalSeats: 2 },
        { flightNumber: 'QR777', airline: 'Qatar Airways', origin: 'Doha', destination: 'Singapore', departureTime: daysFromNow(9, 4), arrivalTime: daysFromNow(9, 18), price: 760.0, totalSeats: 1 },
 
        { flightNumber: 'EY050', airline: 'Etihad', origin: 'Abu Dhabi', destination: 'Cairo', departureTime: daysFromNow(0, new Date().getUTCHours() + 2), arrivalTime: daysFromNow(0, new Date().getUTCHours() + 5), price: 300.0, totalSeats: 100 },
        { flightNumber: 'MS201', airline: 'EgyptAir', origin: 'Cairo', destination: 'Dubai', departureTime: daysFromNow(10, 6), arrivalTime: daysFromNow(10, 11), price: 260.0, totalSeats: 140 },
        { flightNumber: 'GF150', airline: 'Gulf Air', origin: 'Bahrain', destination: 'Dubai', departureTime: daysFromNow(1, 12), arrivalTime: daysFromNow(1, 13, 30), price: 150.0, totalSeats: 120 },
        { flightNumber: 'WY100', airline: 'Oman Air', origin: 'Muscat', destination: 'Dubai', departureTime: daysFromNow(2, 9), arrivalTime: daysFromNow(2, 10, 15), price: 130.0, totalSeats: 130 },
    ]

    for (const f of flights) {
        const existing = await prisma.flight.findFirst({ where: { flightNumber: f.flightNumber, departureTime: f.departureTime } })
        if (existing) continue
        await prisma.flight.create({
            data: { ...f, availableSeats: f.totalSeats },
        })
    }

    console.log(`Seeded ${flights.length} flights (skipping any already present), plus admin + test user.`)
    console.log('Admin login: admin@jadwelny.test / AdminPass123')
    console.log('User login:  user@jadwelny.test / UserPass123')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })