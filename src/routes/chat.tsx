import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MoreHorizontal, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { people } from "@/data/people";

export const Route = createFileRoute("/chat")({
  validateSearch: (s: Record<string, unknown>) => ({ person: typeof s.person === "string" ? s.person : "Emma" }),
  head: () => ({ meta: [{ title: "Chat — TALKSWAHILI" }] }),
  component: ChatPage,
});
type Msg = { id: string; from: "user" | "foreigner"; text: string; time: string };
const KEY = "talkswahili_chat_";
const rewards: Record<string, number> = { Isabella: 54000, Mateo: 37000, Amelia: 74000, Kenji: 48000, Sophie: 43000, Lucas: 62000, Emma: 31000, Daniel: 56000 };
const ids: Record<string, string> = { Isabella:"isabella", Mateo:"mateo", Amelia:"amelia", Kenji:"kenji", Sophie:"sophie", Lucas:"lucas", Emma:"emma", Daniel:"daniel" };

function ChatPage() {
  const navigate = useNavigate();
  const { person: personName } = Route.useSearch();
  const person = useMemo(() => people.find(p => p.name === personName) ?? people[0], [personName]);
  const [text, setText] = useState(""); const [messages, setMessages] = useState<Msg[]>([]); const [gate, setGate] = useState(false); const [seconds, setSeconds] = useState(52);
  const [userId, setUserId] = useState<string | null>(null); const [sessionId] = useState(() => crypto.randomUUID()); const [sentCount, setSentCount] = useState(0); const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) setGate(true); else setUserId(data.user.id);
    });
  }, []);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY + person.name); if (raw) setMessages(JSON.parse(raw)); else setMessages([{ id: "welcome", from: "foreigner", text: "Salamu kutoka huku! Naomba tuanze kwa kujijana kidogo.", time: "" }]); }
    catch { setMessages([{ id: "welcome", from: "foreigner", text: "Salamu kutoka huku! Naomba tuanze kwa kujijana kidogo.", time: "" }]); }
  }, [person.name]);
  useEffect(() => { const id = window.setInterval(() => setSeconds(s => (s <= 0 ? 59 : s - 1)), 1000); return () => window.clearInterval(id); }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { setGate(true); return; }
    const { data: profile } = await supabase.from("profiles").select("activated,banned").eq("id", userId).single();
    if (!profile?.activated || profile.banned) { setGate(true); return; }
    const clean = text.trim(); if (!clean || rewarded) return;
    const nextCount = sentCount + 1;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const mine: Msg = { id: crypto.randomUUID(), from: "user", text: clean, time: now };
    const all = [...messages, mine]; setMessages(all); localStorage.setItem(KEY + person.name, JSON.stringify(all)); setText(""); setSentCount(nextCount);
    if (nextCount === 10) {
      const amount = rewards[person.name] ?? 0;
      const { data, error } = await supabase.rpc("credit_chat_reward", { p_session_id: sessionId, p_foreigner_id: ids[person.name] ?? "emma", p_amount: amount });
      if (!error) { setRewarded(true); setTimeout(() => addForeign(`Hongera! Umefanikisha chat session.`), 900); }
      else console.error("Reward failed", error);
    } else setTimeout(() => addForeign(reply(clean)), 900);
  }
  function addForeign(message: string) { const m: Msg = { id: crypto.randomUUID(), from: "foreigner", text: message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }; setMessages(prev => { const all=[...prev,m]; localStorage.setItem(KEY+person.name,JSON.stringify(all)); return all; }); }

  return (
    <div className="tw-chat-page flex min-h-screen flex-col font-jost">
      <header className="tw-chat-header sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3">
        <button aria-label="Rudi" onClick={() => navigate({ to: "/dashboard" })} className="rounded-full p-2 text-white/80 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <img src={person.avatar} alt={person.name} className="h-12 w-12 rounded-full border-2 border-teal-400/60 object-cover" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-extrabold text-white">{person.name}, {person.age}</div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            Mtandaoni • {person.country}
          </div>
        </div>
        <div className="rounded-full bg-[#122a3a] px-4 py-2 text-lg font-extrabold tracking-wide text-amber-400">
          00:{String(seconds).padStart(2, "0")}
        </div>
        <button aria-label="Funga" onClick={() => navigate({ to: "/dashboard" })} className="ml-1 rounded-full p-2 text-slate-400 hover:bg-white/10">
          <X className="h-7 w-7" />
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-3 pt-6">
        <div className="flex-1 space-y-4 overflow-y-auto pb-5">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-[24px] px-5 py-4 text-[16px] leading-7 shadow-sm ${m.from === "user" ? "rounded-br-md bg-gradient-brand text-[#03161c]" : "rounded-tl-md bg-[#162d3c] text-slate-200"}`}>
                <div>{m.text}</div>
                {m.time && (
                  <div className={`mt-1 text-[10px] ${m.from === "user" ? "text-black/45" : "text-slate-500"}`}>
                    {m.time}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} className="tw-chat-composer sticky bottom-2 flex items-center gap-3 border-t pt-4">
          <button type="button" aria-label="Chaguo" className="hidden rounded-full p-2 text-slate-400 sm:block">
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Andika ujumbe wako..."
            className="h-14 min-w-0 flex-1 rounded-full border border-[#213b4b] bg-[#162d3c] px-6 text-base text-white outline-none placeholder:text-slate-400 focus:border-teal-400/70"
          />
          <button
            aria-label="Tuma ujumbe"
            disabled={!userId || rewarded}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-[#03161c] shadow-lg disabled:opacity-60"
          >
            <Send className="h-6 w-6" />
          </button>
        </form>
      </main>

      {gate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl border border-[#244253] bg-[#102633] p-6 text-white shadow-2xl">
            <h2 className="text-lg font-extrabold">Jisajili ili kuendelea</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Tafadhali jisajili/login na ukamilishe malipo ili utume ujumbe.
            </p>
            <button onClick={() => navigate({ to: "/register" })} className="mt-5 w-full rounded-xl bg-gradient-brand px-4 py-3 font-extrabold text-[#03161c]">
              Jisajili Sasa
            </button>
            <button onClick={() => setGate(false)} className="mt-2 w-full rounded-xl border border-[#294556] bg-transparent px-4 py-3 text-sm font-semibold text-slate-300">
              Rudi nyuma
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function reply(input: string) {
  const s = input.toLowerCase();
  if (s.includes("hello") || s.includes("hi")) return "Hello! Nice to meet you 😊 What would you like to talk about?";
  if (s.includes("habari")) return "I am good, thank you! Na wewe unaendeleaje?";
  if (s.includes("jina")) return "My name is your chat partner. Tell me about yourself!";
  return "That sounds interesting! Tell me more 😊";
}
