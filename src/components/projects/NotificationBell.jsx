import { useState, useEffect, useRef } from "react";
import * as db from "@/lib/db";
import { Bell, X, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function NotificationBell({ currentUser }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dismissed_notifs") || "[]"); } catch { return []; }
  });
  const ref = useRef(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    fetchNotifications();
  }, [currentUser]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await db.ProjectMessage.filter({ message_type: "alert" }, "created_at.desc");
      setNotifications((data || []).filter(m => m.sender_email !== currentUser.email));
    } catch {}
  };

  const dismiss = (id) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem("dismissed_notifs", JSON.stringify(newDismissed));
  };

  const handleAccept = async (notif) => {
    try {
      const collabs = await db.ProjectCollaborator.filter({ project_id: notif.project_id, email: currentUser.email });
      const mine = (collabs || []).find(c => c.status === "invited" || c.status === "pending");
      if (mine) {
        await db.ProjectCollaborator.update(mine.id, { status: "active" });
        await db.ProjectMessage.create({
          project_id: notif.project_id,
          sender_email: currentUser.email,
          sender_name: currentUser.full_name || currentUser.email,
          sender_role: "owner",
          content: `${currentUser.full_name || "A user"} accepted the project invitation.`,
          message_type: "alert",
        });
      }
      dismiss(notif.id);
      fetchNotifications();
    } catch {}
  };

  const handleDecline = async (notif) => {
    try {
      const collabs = await db.ProjectCollaborator.filter({ project_id: notif.project_id, email: currentUser.email });
      const mine = (collabs || [])[0];
      if (mine) await db.ProjectCollaborator.delete(mine.id);
      dismiss(notif.id);
      fetchNotifications();
    } catch {}
  };

  const visible = notifications.filter(n => !dismissed.includes(n.id));
  const unreadCount = visible.length;

  const isInvite = (content) =>
    content?.toLowerCase().includes("started a project for you") ||
    content?.toLowerCase().includes("wants to link you") ||
    content?.toLowerCase().includes("wants to connect");

  return (
    <div className="relative" ref={ref}>
      <div className="relative group">
        <button
          onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
          aria-label="Notifications"
          className="relative p-1.5 rounded-lg hover:bg-white/10 text-blue-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-md text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50" style={{ background: "#0F172A", fontSize: 12, borderRadius: 6 }}>
          Notifications
        </div>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-900 text-sm">Notifications</p>
            {visible.length > 0 && (
              <button onClick={() => {
                const ids = visible.map(n => n.id);
                const newDismissed = [...dismissed, ...ids];
                setDismissed(newDismissed);
                localStorage.setItem("dismissed_notifs", JSON.stringify(newDismissed));
              }} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {visible.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No new notifications</div>
            ) : visible.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700 leading-snug flex-1">{n.content}</p>
                  <button onClick={() => dismiss(n.id)} className="flex-shrink-0 text-gray-300 hover:text-gray-500 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {n.created_date && (
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(n.created_date), "MMM d, h:mm a")}</p>
                )}
                {isInvite(n.content) && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleAccept(n)}
                      className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl hover:bg-green-100">
                      <CheckCircle className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button onClick={() => handleDecline(n)}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100">
                      <XCircle className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}