import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Bell, Info, AlertTriangle } from "lucide-react";

const ROLE_COLORS = {
  owner:         "bg-blue-100 text-blue-700",
  contractor:    "bg-purple-100 text-purple-700",
  vendor:        "bg-orange-100 text-orange-700",
  collaborator:  "bg-green-100 text-green-700",
};

const TYPE_ICONS = {
  message:          <MessageCircle className="w-3 h-3" />,
  update:           <Info className="w-3 h-3 text-blue-500" />,
  alert:            <AlertTriangle className="w-3 h-3 text-red-500" />,
  approval_request: <Bell className="w-3 h-3 text-yellow-500" />,
};

export default function ProjectMessagesTab({ project, currentUser }) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [msgType, setMsgType] = useState("message");
  const bottomRef = useRef(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", project.id],
    queryFn: () => base44.entities.ProjectMessage.filter({ project_id: project.id }, "created_date", 200),
    refetchInterval: 15000,
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectMessage.create(data),
    onSuccess: () => { qc.invalidateQueries(["messages", project.id]); setInput(""); },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    if (!input.trim()) return;
    const senderRole = project.owner_email === currentUser?.email ? "owner" :
      project.is_contractor_project ? "contractor" : "collaborator";
    sendMutation.mutate({
      project_id: project.id,
      sender_email: currentUser?.email || "unknown",
      sender_name: currentUser?.full_name || currentUser?.email || "Unknown",
      sender_role: senderRole,
      content: input.trim(),
      message_type: msgType,
    });
  };

  const grouped = messages.reduce((acc, msg) => {
    const date = new Date(msg.created_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col" style={{ height: 520 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation with your team.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 px-2">{date}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {msgs.map(msg => {
                const isMe = msg.sender_email === currentUser?.email;
                return (
                  <div key={msg.id} className={`flex gap-2.5 mb-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isMe ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}>
                      {(msg.sender_name || msg.sender_email || "?")[0].toUpperCase()}
                    </div>
                    <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-medium text-gray-700">{isMe ? "You" : (msg.sender_name || msg.sender_email)}</span>
                        {msg.sender_role && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[msg.sender_role] || "bg-gray-100 text-gray-500"}`}>
                            {msg.sender_role}
                          </span>
                        )}
                        {msg.message_type !== "message" && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            {TYPE_ICONS[msg.message_type]}
                            {msg.message_type.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : msg.message_type === "alert"
                            ? "bg-red-50 border border-red-100 text-red-800 rounded-bl-sm"
                            : msg.message_type === "update"
                              ? "bg-blue-50 border border-blue-100 text-blue-800 rounded-bl-sm"
                              : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-gray-400 mt-1 px-1">
                        {new Date(msg.created_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex gap-2">
          {["message", "update", "alert", "approval_request"].map(t => (
            <button
              key={t}
              onClick={() => setMsgType(t)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
                msgType === t ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              {TYPE_ICONS[t]} {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Message your team, vendors, or clients..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <Button onClick={send} disabled={!input.trim()} className="bg-blue-600 hover:bg-blue-700 w-10 h-10 p-0 flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}