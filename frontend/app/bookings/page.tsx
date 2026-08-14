"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiFetch("/bookings");
      setBookings(data.data ?? data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id: string) => {
    try {
      await apiFetch(`/bookings/${id}/cancel`, { method: "POST" });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>My Bookings</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {bookings.map((b) => (
          <li key={b.id} style={{ margin: "12px 0", border: "1px solid #ccc", padding: 8 }}>
            {b.flight?.origin} → {b.flight?.destination} — {b.status}
            {b.status !== "CANCELLED" && (
              <button onClick={() => cancel(b.id)} style={{ marginLeft: 8 }}>Cancel</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}