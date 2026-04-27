import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, UserPlus, CheckCircle2 } from "lucide-react";

export default function InviteCityAdminModal({ city, onClose }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError("");
    await base44.users.inviteUser(email.trim(), "city_admin");
    // After invite, we can't set city_name directly since the user doesn't exist yet.
    // We send an email note as a reminder.
    await base44.integrations.Core.SendEmail({
      to: email.trim(),
      subject: `You've been invited to manage ${city.name} permits`,
      body: `You've been invited as a city administrator for ${city.name}.\n\nOnce you log in, your account will need to be assigned to "${city.name}" by the system administrator.\n\nPlease contact your admin after logging in to complete setup.`,
    });
    setSending(false);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Invite City Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Invitation sent!</p>
            <p className="text-sm text-gray-500 mt-1">
              {email} will be invited. After they register, assign them to <strong>{city.name}</strong> via the Users panel.
            </p>
            <Button className="mt-4 w-full" variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Invite someone to manage <strong>{city.name}</strong>. They'll receive an email and need to be assigned to this city after registering.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@city.gov"
                onKeyDown={e => e.key === "Enter" && handleInvite()}
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 gradient-primary text-white" onClick={handleInvite} disabled={sending || !email.trim()}>
                <UserPlus className="w-4 h-4" />
                {sending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}