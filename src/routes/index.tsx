import { createFileRoute } from "@tanstack/react-router";
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

const ACTIVATE_URL = "https://adsblog.app/page/reg.php?reg=MrBusiness";
const SMS_NUMBER = "0743871339";
const WHATSAPP_CHANNEL_LINK = "https://whatsapp.com/channel/0029VbCvS6cJZg4EHb909Y0N";

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

function ChatModal({ person, onClose }: { person: (typeof people)[number]; onClose: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<{ label: string; price: string; minutes: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");

  const plans = [
    { label: "Dakika 1", price: "TZS 5,000", minutes: 1 },
    { label: "Dakika 20", price: "TZS 30,000", minutes: 20 },
    { label: "Dakika 30", price: "TZS 50,000", minutes: 30 },
    { label: "Dakika 45", price: "TZS 65,000", minutes: 45 },
    { label: "Saa moja", price: "TZS 120,000", minutes: 60 },
    { label: "Masaa mawili", price: "TZS 150,000", minutes: 120 },
  ];

  useEffect(() => {
    if (!selectedPlan || completed || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [selectedPlan, completed, secondsLeft]);

  useEffect(() => {
    if (selectedPlan && secondsLeft === 0) setCompleted(true);
  }, [selectedPlan, secondsLeft]);

  const choosePlan = (plan: (typeof plans)[number]) => {
    setSelectedPlan(plan);
    setSecondsLeft(60);
    setCompleted(false);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  const timerMinutes = Math.floor(secondsLeft / 60);
  const timerSeconds = secondsLeft % 60;

  if (!selectedPlan) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4">
        <div className="w-full max-w-xl rounded-t-[2rem] border border-border bg-card p-5 shadow-glow sm:rounded-[2rem]">
          <div className="flex items-start gap-3">
            <img src={person.avatar} alt={person.name} className="h-14 w-14 rounded-full border-2 border-primary object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-xl font-extrabold">{person.name}, {person.age}</p>
              <p className="text-sm text-muted-foreground">{person.country} • {person.online ? "Online" : "Offline"}</p>
              <p className="mt-1 text-sm text-muted-foreground">Chagua muda unaotaka kuchati na ulipwe</p>
            </div>
            <button aria-label="Funga" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {plans.map((plan) => (
              <button
                key={plan.label}
                onClick={() => choosePlan(plan)}
                className="flex h-14 w-full items-center justify-between rounded-full border border-border bg-secondary/70 px-5 text-left transition hover:border-primary/50 hover:bg-secondary"
              >
                <span className="text-sm font-bold sm:text-base">{plan.label}</span>
                <span className="text-base font-extrabold text-gold sm:text-lg">{plan.price}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-3xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-center text-xs font-semibold leading-5 text-red-400">
            ONYO: Ukichat na usimalize muda uliochagua, hulipwi kabisa.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#071923]">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="relative shrink-0">
          <img src={person.avatar} alt={person.name} className="h-12 w-12 rounded-full border-2 border-primary object-cover" />
          <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full border-2 border-[#071923] bg-success" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{person.name}, {person.age}</p>
          <p className="text-sm text-muted-foreground">● {person.online ? "Hayupo mtandaoni" : "Hayupo mtandaoni"} • {person.country}</p>
        </div>
        <div className="rounded-full bg-secondary px-4 py-2 text-sm font-extrabold text-gold tabular-nums">
          {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
        </div>
        <button aria-label="Funga chat" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-xl rounded-3xl bg-secondary/40 px-5 py-4 text-center text-sm leading-6 text-muted-foreground">
          {person.name} hayupo mtandaoni kwa sasa. Hatajibu ujumbe wako na hakuna malipo yatakayotolewa kwa mazungumzo haya.
        </div>
      </div>

      <div className="border-t border-border p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Andika ujumbe wako..."
            className="min-w-0 flex-1 rounded-full border border-border bg-secondary px-5 py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={sendMessage} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
            <Send className="h-6 w-6" />
          </button>
        </div>
      </div>

      {completed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-6 text-center shadow-glow sm:p-8">
            <button aria-label="Funga" onClick={onClose} className="absolute right-8 top-8 hidden h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground sm:flex">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-gold text-4xl">🎉</div>
            <h2 className="mt-5 text-3xl font-extrabold">Hongera!</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
              Umefanikiwa kumaliza muda wa chat wa <span className="font-extrabold text-primary">{selectedPlan.label}</span> na malipo ya <span className="font-extrabold text-gold">{selectedPlan.price}</span> yameandaliwa. Ili kupokea malipo haya, lazima uwe na akaunti iliyo hai (active account).
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Akaunti hii itakuwezesha kuingiza malipo yako kwenye namba yako ya simu baada ya kulipwa.
            </p>
            <a
              href={ACTIVATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-brand mt-5 flex h-14 w-full items-center justify-center rounded-full text-sm font-extrabold text-primary-foreground shadow-glow"
            >
              Fungua na Activate Akaunti Hapa
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivateModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold">{title}</h3>
          </div>
          <button aria-label="Funga" onClick={onClose} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Akaunti yako haijawashwa (not activated). Bonyeza kitufe hapa chini ili kuwasha akaunti
          yako, kisha urudi kuendelea kuchati na kupokea malipo.
        </p>
        <a
          href={ACTIVATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-gold mt-3 flex h-10 items-center justify-center rounded-xl text-xs font-extrabold text-gold-foreground"
        >
          Activate Account
        </a>
        <button
          onClick={onClose}
          className="mt-2 h-10 w-full rounded-xl border border-border bg-secondary text-sm font-semibold"
        >
          Baadaye
        </button>
      </div>
    </div>
  );
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
    <div className={`flex min-h-[104px] min-w-0 flex-col justify-between rounded-xl border p-2.5 ${border} ${rest[0]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[10px] font-semibold leading-tight text-muted-foreground sm:text-[11px]">{label}</p>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary ${rest[1]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-1 text-base font-extrabold tracking-tight tabular-nums text-foreground sm:text-lg">
        {value}
      </p>
      <div className="mt-1 min-h-6">
        {action ?? <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Index() {
  const [modal, setModal] = useState<string | null>(null);
  const [chatPerson, setChatPerson] = useState<(typeof people)[number] | null>(null);
  const [livePeople, setLivePeople] = useState(people);

  useEffect(() => {
    const rotate = () => {
      const tick = Math.floor(Date.now() / 7000);
      setLivePeople(people.map((person, index) => ({
        ...person,
        online: ((index + tick) % 5) !== 2,
      })));
    };
    rotate();
    const timer = window.setInterval(rotate, 7000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="mx-auto w-full max-w-xl px-3 pb-10 pt-4 sm:px-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Talkswahili logo"
            width={44}
            height={44}
            className="h-10 w-10 rounded-xl object-contain shadow-glow"
          />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">
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

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setModal("Install App")}
          className="bg-gradient-brand flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-primary-foreground shadow-glow"
        >
          <img src={logo} alt="" width={24} height={24} className="h-6 w-6 rounded-lg object-contain" />
          Install App
        </button>
        <a
          href="#huduma"
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-xs font-bold"
        >
          <Headphones className="h-4 w-4" /> Customer Care
        </a>
      </div>

      <section className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
        <StatCard
          label="Mapato Yote (Net Profit)"
          value="TZS 0"
          hint="Jumla kuu ya mapato tangu uanze"
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Salio la Sasa (Current Balance)"
          value="TZS 0"
          tone="accent"
          icon={<Wallet className="h-4 w-4" />}
          action={
            <button
              onClick={() => setModal("Toa Pesa")}
              className="bg-gradient-gold h-7 w-full rounded-lg text-[10px] font-bold text-gold-foreground"
            >
              Toa Pesa
            </button>
          }
        />
        <StatCard
          label="Pesa Iliyotolewa (Withdrawn)"
          value="TZS 0"
          hint="Jumla ya pesa ambazo tayari umeshatoa"
          tone="gold"
          icon={<ArrowDownToLine className="h-4 w-4" />}
        />
      </section>

      <a
        href={ACTIVATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-gold mt-3 flex h-10 items-center justify-center rounded-xl text-xs font-extrabold text-gold-foreground shadow-glow"
      >
        Fungua Account Hapa
      </a>

      <section className="mt-5">
        <h2 className="text-lg font-extrabold tracking-tight">Wazungu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Waliopo mtandaoni hujibu chati na malipo hutolewa. Wasiokuwepo hawajibu.
        </p>

        <div className="mt-2 space-y-2">
          {livePeople.map((p, i) => (
            <article key={`${p.name}-${i}`} className="rounded-xl border border-border bg-card p-2.5">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={p.avatar}
                    alt={`Picha ya ${p.name}`}
                    width={52}
                    height={52}
                    loading="lazy"
                    className="h-10 w-10 rounded-full border border-border object-cover"
                    style={{ height: 40, width: 40 }}
                  />
                  {p.online && (
                    <span className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
                  )}
                </div>
                <span className="-ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-secondary text-[13px] leading-none">
                  {p.flag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">
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
              <div className="mt-1.5 grid grid-cols-3 gap-1">
                <button
                  onClick={() => setChatPerson(p)}
                  className="bg-gradient-brand flex h-8 items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-primary-foreground"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </button>
                <button
                  onClick={() => setModal(`Voice Call na ${p.name}`)}
                  className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-secondary text-[11px] font-bold"
                >
                  <Phone className="h-3.5 w-3.5" /> Voice Call
                </button>
                <button
                  onClick={() => setModal(`Video Call na ${p.name}`)}
                  className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-secondary text-[11px] font-bold"
                >
                  <Video className="h-3.5 w-3.5" /> Video Call
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="huduma" className="mt-7 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-lg font-extrabold tracking-tight">Huduma kwa Wateja</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Una swali au changamoto? Wasiliana nasi moja kwa moja.
        </p>
        <div className="mt-3 space-y-1.5">
          <a
            href={WHATSAPP_CHANNEL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-brand flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp Channel
          </a>
          <a
            href={`sms:${SMS_NUMBER}?body=${encodeURIComponent("HABARI NINA SWALI KUHUSU TALKSWAHILI, NIELEKEZE")}`}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-xs font-bold"
          >
            <Send className="h-4 w-4" /> Tuma SMS: {SMS_NUMBER}
          </a>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-extrabold tracking-tight">Miamala ya Hivi Karibuni</h2>
        <div className="mt-3 h-40 overflow-hidden rounded-2xl border border-border bg-card p-3">
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

      <section className="mt-6">
        <h2 className="text-lg font-extrabold tracking-tight">Rating na Maoni ya Watumiaji</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Maoni halisi kutoka kwa waliolipwa Talkswahili
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <p className="text-2xl font-extrabold text-gold">4.7</p>
          <div>
            <div className="flex gap-0.5 text-gold">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">1308+ maoni</p>
          </div>
        </div>
        <div className="mt-2 space-y-2">
          {reviews.map((r) => (
            <article key={r.name} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <span className="bg-gradient-brand flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold text-primary-foreground">
                  {r.name.charAt(0)}
                </span>
                <div>
                  <p className="text-xs font-bold">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.city}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{r.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-primary/30 bg-primary/10 p-5 text-center">
        <h2 className="text-base font-extrabold">Weka Talkswahili kwenye simu yako</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Gusa hapa chini ili app ijiweke kwenye home screen — kuingia kwa haraka muda wowote.
        </p>
        <button
          onClick={() => setModal("Install App")}
          className="bg-gradient-brand mt-2 h-10 w-full rounded-xl text-xs font-bold text-primary-foreground shadow-glow"
        >
          Install App
        </button>
      </section>

      <PayoutToasts />

      {modal && <ActivateModal title={modal} onClose={() => setModal(null)} />}
      {chatPerson && <ChatModal person={chatPerson} onClose={() => setChatPerson(null)} />}
    </main>
  );
}
