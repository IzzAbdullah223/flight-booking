"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "@/lib/api";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (confirmError) setError(confirmError.message || "Payment failed");
    else setDone(true);
  };

  if (done) return <p>Payment confirmed! Check <a href="/bookings">My Bookings</a>.</p>;

  return (
    <form onSubmit={submit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default function PayPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    apiFetch("/payments/create-intent", {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    }).then((data) => setClientSecret(data.clientSecret));
  }, [bookingId]);

  if (!clientSecret) return <p>Loading payment...</p>;

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <h1>Pay</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm bookingId={bookingId} />
      </Elements>
    </div>
  );
}