"use client";
import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function BookPage() {
  const { flightId } = useParams<{ flightId: string }>();
  const searchParams = useSearchParams();
  const seatCount = Number(searchParams.get("passengers") || 1);
  const router = useRouter();

  const [passengers, setPassengers] = useState(
    Array.from({ length: seatCount }, () => ({
      fullName: "", dateOfBirth: "", nationality: "", passportNumber: "", email: "", contactNumber: "",
    }))
  );
  const [error, setError] = useState("");

  const updatePassenger = (i: number, field: string, value: string) => {
    const next = [...passengers];
    (next[i] as any)[field] = value;
    setPassengers(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const booking = await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({ flightId, seatCount, passengers }),
      });
      router.push(`/pay/${booking.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 500, margin: "40px auto" }}>
      <h1>Passenger Details</h1>
      {passengers.map((p, i) => (
        <fieldset key={i} style={{ marginBottom: 16 }}>
          <legend>Passenger {i + 1}</legend>
          {(["fullName", "dateOfBirth", "nationality", "passportNumber", "email", "contactNumber"] as const).map((field) => (
            <input
              key={field}
              placeholder={field}
              type={field === "dateOfBirth" ? "date" : "text"}
              value={(p as any)[field]}
              onChange={(e) => updatePassenger(i, field, e.target.value)}
              style={{ display: "block", margin: "4px 0" }}
            />
          ))}
        </fieldset>
      ))}
      <button type="submit">Continue to Payment</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}