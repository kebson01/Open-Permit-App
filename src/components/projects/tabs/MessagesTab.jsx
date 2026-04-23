import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, Loader2, EyeOff } from "lucide-react";
import { format } from "date-fns";

export default function MessagesTab({ project, currentUser, mode }) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();
  const isContractor = mode === "contractor";

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", project.id],
    queryFn: async () => {
      const { data } = await supabase.from("project_messages").select("*").eq("project_id", project.id).order("created_at", { ascending: true });
      return data || [];
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const visibleMessages = messages.filter(m => {
    if (m.message_type === "alert") return false; // alerts shown in notifications, not chat
    if (m.sender_role === "contractor" && m.content?.startsWith("[INTERNAL]") && !isContractor) return false;
    return true;
  });

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const content = isInternal ? `[INTERNAL] ${text}` : text;
    await supabase.from("project_messages").insert({
      project_id: project.id,
      sender_email: currentUser?.email,
      sender_name: currentUser?.full_name || currentUser?.user_metadata?.full_name || currentUser?.email,
      sender_role: isContractor ? "contractor" : "owner",
      content,
      message_type: "message",
    });
    queryClient.invalidateQueries({ queryKey: ["messages", project.id] });
    setText("");
    setSending(false);
  };

  const generateUpdate = async () => {
    setGenerating(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Draft a brief friendly project status update message from a contractor to their homeowner client.
Project: "${project.name}" | Status: ${project.status?.replace(/_/g, " ")} | City: ${project.city_name}
${project.progress_pct ? `Progress: ${project.progress_pct}%` : ""}
Write 2-3 sentences. No greeting needed, just the update text.`,
    });
    setText(res);
    setGenerating(false);
  };

  const isMyMessage = (msg) => msg.sender_email === currentUser?.email;

  return (
    <div className="flex flex-col" style={{ height: 420 }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No messages yet. Start the conversation with your {isContractor ? "client" : "contractor or client"}.
          </div>
        ) : visibleMessages.map(msg => {
          const mine = isMyMessage(msg);
          const internal = msg.content?.startsWith("[INTERNAL]");
          const displayContent = internal ? msg.content.replace("[INTERNAL] ", "") : msg.content;

          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                mine
                  ? "rounded-br-md text-white"
                  : "rounded-bl-md border border-gray-100 shadow-sm"
              } ${internal ? "opacity-75 ring-1 ring-purple-200" : ""}`}
                style={mine ? { background: "#3B82F6" } : { background: "#EFF6FF", color: "#1e3a5f" }}
              >
                {!mine && <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.sender_name}</p>}
                {internal && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                    <EyeOff className="w-3 h-3" /> Internal note
                  </div>
                )}
                <p className="text-sm leading-relaxed">{displayContent}</p>
                <p className={`text-xs mt-1 ${mine ? "text-blue-200" : "opacity-50"}`}>
                  {(msg.created_at || msg.created_date) ? format(new Date(msg.created_at || msg.created_date), "MMM d, h:mm a") : ""}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 pt-3 mt-2">
        {isContractor && (
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={generateUpdate}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-50"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate update
            </button>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              <div
                onClick={() => setIsInternal(!isInternal)}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${isInternal ? "bg-purple-500" : "bg-gray-200"}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${isInternal ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <EyeOff className="w-3 h-3" /> Internal note
            </label>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={isInternal ? "Internal note (only you see this)..." : "Type a message..."}
            className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 ${
              isInternal ? "border-purple-200 focus:ring-purple-400 bg-purple-50" : "border-gray-200 focus:ring-blue-400"
            }`}
          />
          <button type="submit" disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            style={{ background: isInternal ? "#9333ea" : "#3B82F6" }}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}