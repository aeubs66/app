"use client";
import { useState } from "react";
export default function BillingButton() {
  const [message, setMessage] = useState("");
  return (
    <div>
      <button
        className="button secondary"
        onClick={() =>
          setMessage(
            "Billing is managed by your connected service. Contact your workspace administrator for plan changes.",
          )
        }
      >
        Billing information
      </button>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </div>
  );
}
