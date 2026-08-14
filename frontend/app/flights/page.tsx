"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function FlightsPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [flights, setFlights] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const search = async (p = 1) => {
    setError("");
    try {
      const params = new URLSearchParams({
        ...(origin && { origin }),
        ...(destination && { destination }),
        ...(date && { date }),
        passengers: String(passengers),
        page: String(p),
      });
      const data = await apiFetch(`/flights?${params}`);
      setFlights(data.data);
      setPage(p);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Search Flights</h1>
      <input placeholder="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
      <input placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input type="number" min={1} value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} />
      <button onClick={() => search(1)}>Search</button>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {flights.map((f) => (
          <li key={f.id} style={{ margin: "12px 0", border: "1px solid #ccc", padding: 8 }}>
            {f.airline} — {f.origin} → {f.destination} — {new Date(f.departureTime ?? f.date).toLocaleString()} — ${f.price} — {f.availableSeats} seats
            <br />
            <Link href={`/book/${f.id}?passengers=${passengers}`}>Book</Link>
          </li>
        ))}
      </ul>

      <button onClick={() => search(page - 1)} disabled={page <= 1}>Prev</button>
      <button onClick={() => search(page + 1)}>Next</button>
      <p><Link href="/bookings">My Bookings</Link></p>
    </div>
  );
}