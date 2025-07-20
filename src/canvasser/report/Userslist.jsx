// src/components/InviteUserCard.jsx
import React, { useState } from "react";
import { useSendInviteMutation } from "../../features/leads/leadsApiSlice";

export default function InviteUserCard() {
  const [email, setEmail] = useState("");
  const [sendInvite, { isLoading, isSuccess, error, data }] = useSendInviteMutation();

  // Success message (from response)
  const successMsg = data?.message;

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await sendInvite({ email }).unwrap();
      setEmail("");
    } catch (err) {
      // Handled below
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-2xl rounded-2xl border border-gray-100">
      <h2 className="text-2xl font-bold mb-3 text-center">Invite User</h2>
      <p className="mb-6 text-gray-600 text-center">Enter the user's email to send an invitation.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <button
          type="submit"
          className={`w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition ${
            isLoading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={isLoading || !email}
        >
          {isLoading ? "Sending..." : "Send Invite"}
        </button>
      </form>

      {/* Success/Errors */}
      {isSuccess && successMsg && (
        <div className="mt-4 text-green-600 text-center font-medium">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-600 text-center font-medium">
          {error?.data?.message || "Failed to send invitation."}
        </div>
      )}
    </div>
  );
}
