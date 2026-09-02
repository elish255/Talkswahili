import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Headphones,
  MessageCircle,
  Phone,
  Send,
  Star,
  TrendingUp,
  Video,
  Wallet,
  ArrowDownToLine,
  ShieldCheck,
  X,
} from "lucide-react";

import logo from "@/assets/talkswahili-logo.png";
import { PayoutToasts } from "@/components/PayoutToasts";
import { people, reviews, withdrawals } from "@/data/people";

const WHATSAPP_NUMBER = "0612820109";
const WHATSAPP_LINK = "https://wa.me/255612820109";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Talkswahili — Chati na Wageni, Lipwa Papo Hapo" },
      {
        name: "description",
        content:
          "Chati, voice call na video call na wageni kwa Kiswahili, fuatilia mapato yako na toa pesa papo hapo kwenye dashibodi ya Talkswahili.",
      },
      { property: "og:title", content: "Talkswahili — Chati na Wageni, Lipwa Papo Hapo" },
      {
        property: "og:description",
        content:
          "Chati na wageni waliopo mtandaoni, fuatilia mapato yako na toa pesa kupitia M-Pesa, Tigo Pesa au Airtel Money.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function ChatModal({
  person,
  onClose,
}: {
  person: (typeof people)[number];
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<{ from: "foreigner" | "user"; text: string }[]>([
    { from: "foreigner", text: `Hi! Mimi ni ${person.name}. Habari yako?` },
  ]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const send = () => {
    const value = text.trim();
    if (!value || sending) return;
    setText("");
    setMessages((m) => [...m, { from: "user", text: value }]);
    const user = JSON.parse(localStorage.getItem("talkswahili_user") || "{}");
    const nextCount = Number(user.messageCount || 0) + 1;
    let nextBalance = Number(user.balance || 0);
    if (nextCount % 10 === 0) {
      const reward = Number(String(person.pay).replace(/[^0-9]/g, "")) || 0;
      nextBalance += reward;
      user.lastReward = reward;
    }
    localStorage.setItem("talkswahili_user", JSON.stringify({ ...user, messageCount: nextCount, balance: nextBalance }));
    setSending(true);
    setTimeout(() => {
      const replies = [
        `Hello! Nimefurahi kuongea na wewe 😊`,
        `Tell me more about yourself.`,
        `That sounds interesting! Unaishi wapi?`,
        `I am online, unaweza kuendelea kuongea nami.`,
      ];
      setMessages((m) => [...m, { from: "foreigner", text: replies[m.length % replies.length] }]);
      setSending(false);
    }, 1200);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="flex h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card sm:h-[680px] sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <img src={person.avatar} alt={person.name} className="h-11 w-11 rounded-full object-cover" />
          <div className="flex-1"><p className="font-bold">{person.name}</p><p className="text-xs text-success">{person.online ? "Online" : "Offline"}</p></div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground"><X /></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "bg-gradient-brand text-primary-foreground" : "bg-secondary"}`}>{m.text}</div>
            </div>
          ))}
          {sending && <p className="text-xs text-muted-foreground">Anaandika...</p>}
        </div>
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Andika ujumbe..." className="min-w-0 flex-1 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm outline-none" />
            <button onClick={send} className="bg-gradient-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({ balance, onClose, onWithdraw }: { balance: number; onClose: () => void; onWithdraw: (amount: number, phone: string) => void }) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 50000) return setError("Kiasi cha chini cha kutoa ni TZS 50,000.");
    if (n > balance) return setError("Salio lako halitoshi.");
    if (phone.replace(/\D/g, "").length < 9) return setError("Namba ya simu si sahihi.");
    onWithdraw(n, phone);
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
    <div className="w-full max-w-md rounded-3xl bg-card p-5">
      <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold">Toa Pesa</h3><button onClick={onClose}><X /></button></div>
      <p className="mt-2 text-sm text-muted-foreground">Salio: TZS {balance.toLocaleString()}</p>
      {error && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <label className="mt-4 block text-xs font-bold">Amount</label>
      <input inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value.replace(/\D/g,""))} className="k-field mt-1" placeholder="50000" />
      <label className="mt-4 block text-xs font-bold">Phone number</label>
      <input inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="k-field mt-1" placeholder="06XXXXXXXX" />
      <button onClick={submit} className="k-btn-green mt-5">Toa Pesa</button>
    </div>
  </div>;
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  action,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "primary" | "accent" | "gold";
  action?: React.ReactNode;
}) {
  const tones = {
    primary: "border-primary/30 bg-primary/10 text-primary",
    accent: "border-accent/35 bg-accent/10 text-accent",
    gold: "border-gold/35 bg-gold/10 text-gold",
  } as const;
  const [border, ...rest] = tones[tone].split(" ");
  return (
    <div className={`flex min-h-[148px] flex-col justify-between rounded-3xl border p-4 ${border} ${rest[0]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-secondary ${rest[1]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-2xl">
        {value}
      </p>
      <div className="mt-3 h-10">
        {action ?? <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Index() {
  const navigate = useNavigate();
  const [chatPerson, setChatPerson] = useState<(typeof people)[number] | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [withdrawn, setWithdrawn] = useState(0);
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("talkswahili_user") || "{}");
      setBalance(Number(user.balance || 0));
      setWithdrawn(Number(user.withdrawn || 0));
    } catch {}
  }, []);
  const openChat = (p: (typeof people)[number]) => {
    const user = JSON.parse(localStorage.getItem("talkswahili_user") || "null");
    if (!user) { navigate({ to: "/register" }); return; }
    if (!user.hasPaid) { navigate({ to: "/payment" }); return; }
    setChatPerson(p);
  };
  const doWithdraw = (amount: number, phone: string) => {
    const user = JSON.parse(localStorage.getItem("talkswahili_user") || "{}");
    const next = { ...user, balance: balance - amount, withdrawn: withdrawn + amount, withdrawalPhone: phone };
    localStorage.setItem("talkswahili_user", JSON.stringify(next));
    setBalance(balance - amount); setWithdrawn(withdrawn + amount); setWithdrawOpen(false);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Talkswahili logo"
            width={44}
            height={44}
            className="h-11 w-11 rounded-2xl object-contain shadow-glow"
          />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Talk<span className="text-gradient-brand">swahili</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">Kiswahili ni Fursa</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5">
          <span className="pulse-dot h-2 w-2 rounded-full bg-success" />
          <span className="text-[11px] font-semibold">3490 online</span>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => alert("Install App: tumia chaguo la Add to Home Screen kwenye browser yako.")}
          className="bg-gradient-brand flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground shadow-glow"
        >
          <img src={logo} alt="" width={24} height={24} className="h-6 w-6 rounded-lg object-contain" />
          Install App
        </button>
        <button
          onClick={() => navigate({ to: "/register" })}
          className="bg-gradient-brand flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground shadow-glow"
        >
          Jisajili Sasa
        </button>
        <a
          href="#huduma"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-secondary text-sm font-bold"
        >
          <Headphones className="h-4 w-4" /> Customer Care
        </a>
      </div>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Mapato Yote (Net Profit)"
          value="TZS 0"
          hint="Jumla kuu ya mapato tangu uanze"
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Salio la Sasa (Current Balance)"
          value={`TZS ${balance.toLocaleString()}`}
          tone="accent"
          icon={<Wallet className="h-4 w-4" />}
          action={
            <button
              onClick={() => setWithdrawOpen(true)}
              className="bg-gradient-gold h-10 w-full rounded-2xl text-sm font-bold text-gold-foreground"
            >
              Toa Pesa
            </button>
          }
        />
        <StatCard
          label="Pesa Iliyotolewa (Withdrawn)"
          value={`TZS ${withdrawn.toLocaleString()}`}
          hint="Jumla ya pesa ambazo tayari umeshatoa"
          tone="gold"
          icon={<ArrowDownToLine className="h-4 w-4" />}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold tracking-tight">Wazungu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Waliopo mtandaoni hujibu chati na malipo hutolewa. Wasiokuwepo hawajibu.
        </p>

        <div className="mt-4 space-y-3">
          {people.map((p, i) => (
            <article key={`${p.name}-${i}`} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={p.avatar}
                    alt={`Picha ya ${p.name}`}
                    width={52}
                    height={52}
                    loading="lazy"
                    className="h-13 w-13 rounded-full border border-border object-cover"
                    style={{ height: 52, width: 52 }}
                  />
                  {p.online && (
                    <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
                  )}
                </div>
                <span className="-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[13px] leading-none">
                  {p.flag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {p.name}, {p.age}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.country} •{" "}
                    <span className={p.online ? "font-semibold text-success" : "text-muted-foreground"}>
                      {p.online ? "Online" : "Offline"}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">{p.duration}</p>
                  <p className="text-sm font-extrabold text-gold tabular-nums">{p.pay}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => openChat(p)}
                  className="bg-gradient-brand flex h-10 items-center justify-center gap-1 rounded-xl text-xs font-bold text-primary-foreground"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </button>
                <button
                  onClick={() => openChat(p)}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl border border-border bg-secondary text-xs font-bold"
                >
                  <Phone className="h-3.5 w-3.5" /> Voice Call
                </button>
                <button
                  onClick={() => openChat(p)}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl border border-border bg-secondary text-xs font-bold"
                >
                  <Video className="h-3.5 w-3.5" /> Video Call
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="huduma" className="mt-10 rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-extrabold tracking-tight">Huduma kwa Wateja</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Una swali au changamoto? Wasiliana nasi moja kwa moja.
        </p>
        <div className="mt-4 space-y-2">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-brand flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp: {WHATSAPP_NUMBER}
          </a>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold tracking-tight">Miamala ya Hivi Karibuni</h2>
        <div className="mt-3 h-40 overflow-hidden rounded-3xl border border-border bg-card p-4">
          <div className="marquee-up space-y-3">
            {[...withdrawals, ...withdrawals].map((w, i) => (
              <p key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-success" />
                <span>{w}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold tracking-tight">Rating na Maoni ya Watumiaji</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Maoni halisi kutoka kwa waliolipwa Talkswahili
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
          <p className="text-3xl font-extrabold text-gold">4.7</p>
          <div>
            <div className="flex gap-0.5 text-gold">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">1308+ maoni</p>
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {reviews.map((r) => (
            <article key={r.name} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="bg-gradient-brand flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-primary-foreground">
                  {r.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.city}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{r.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-primary/30 bg-primary/10 p-5 text-center">
        <h2 className="text-base font-extrabold">Weka Talkswahili kwenye simu yako</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Gusa hapa chini ili app ijiweke kwenye home screen — kuingia kwa haraka muda wowote.
        </p>
        <button
          onClick={() => alert("Install App: tumia chaguo la Add to Home Screen kwenye browser yako.")}
          className="bg-gradient-brand mt-3 h-12 w-full rounded-2xl text-sm font-bold text-primary-foreground shadow-glow"
        >
          Install App
        </button>
      </section>

      <PayoutToasts />

      {chatPerson && <ChatModal person={chatPerson} onClose={() => setChatPerson(null)} />}
      {withdrawOpen && <WithdrawModal balance={balance} onClose={() => setWithdrawOpen(false)} onWithdraw={doWithdraw} />}
    </main>
  );
}
