import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getLocalUser } from "@/lib/local-auth";
import {
  Headphones,
  MessageCircle,
  Phone,
  Star,
  TrendingUp,
  Video,
  Wallet,
  ArrowDownToLine,
  ShieldCheck,
  X,
} from "lucide-react";

import logo from "@/assets/talkswahili-logo.jpg";
import { PayoutToasts } from "@/components/PayoutToasts";
import { people, reviews, withdrawals } from "@/data/people";

const WHATSAPP_NUMBER = "0612820109";
const WHATSAPP_LINK = "https://wa.me/255612820109";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TALKSWAHILI — Chati na Wageni, Lipwa Papo Hapo" },
      {
        name: "description",
        content:
          "TALKSWAHILI ni jukwaa la kuchat na wageni kwa Kiswahili, voice call na video call, kufuatilia mapato na kutoa pesa papo hapo Tanzania.",
      },
      {
        name: "keywords",
        content: "TALKSWAHILI, Talkswahili, Talk Swahili, chat na wageni, kuchat na wazungu, lipwa kwa kuchat, kazi online Tanzania, kipato online Tanzania, talkswahililive.site",
      },
      { property: "og:title", content: "TALKSWAHILI — Chati na Wageni, Lipwa Papo Hapo" },
      {
        property: "og:description",
        content:
          "TALKSWAHILI — chati na wageni waliopo mtandaoni, pata kipato kwa kuchat, fuatilia balance na tumia huduma za malipo kwa USSD Push.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function ActivateModal({ title, onClose }: { title: string; onClose: () => void }) {
  const navigate = useNavigate();
  const isInstall = title === "Install App";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary"><ShieldCheck className="h-5 w-5" /></span><h3 className="text-base font-extrabold">{title}</h3></div>
          <button aria-label="Funga" onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{isInstall ? "TALKSWAHILI inaweza kuwekwa kwenye home screen ya simu yako kwa matumizi ya haraka." : `${title} inapatikana baada ya akaunti yako kusajiliwa na malipo kuthibitishwa.`}</p>
        {!isInstall && <button onClick={() => navigate({ to: "/register" })} className="bg-gradient-gold mt-4 flex h-12 w-full items-center justify-center rounded-2xl text-sm font-extrabold text-gold-foreground">Jisajili Sasa</button>}
        <button onClick={onClose} className="mt-2 h-11 w-full rounded-2xl border border-border bg-secondary text-sm font-semibold">Baadaye</button>
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
  const [modal, setModal] = useState<string | null>(null);
  const navigate = useNavigate();
  const openChat = (name: string) => { navigate({ to: "/chat", search: { person: name } }); };
  const registerOrDashboard = () => { const u = getLocalUser(); if (u?.paid) navigate({ to: "/dashboard" }); else navigate({ to: "/register" }); };

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

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={registerOrDashboard}
          className="bg-gradient-gold flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-gold-foreground shadow-glow"
        >
          Jisajili Sasa
        </button>
        <button
          onClick={() => setModal("Install App")}
          className="bg-gradient-brand flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground shadow-glow"
        >
          <img src={logo} alt="" width={24} height={24} className="h-6 w-6 rounded-lg object-contain" />
          Install App
        </button>
        <a
          href="#huduma"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-secondary text-sm font-bold"
        >
          <Headphones className="h-4 w-4" /> Customer Care
        </a>
        <button onClick={() => navigate({ to: "/dashboard" })} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-secondary text-sm font-bold">Dashboard</button>
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
          value="TZS 0"
          tone="accent"
          icon={<Wallet className="h-4 w-4" />}
          action={
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="bg-gradient-gold h-10 w-full rounded-2xl text-sm font-bold text-gold-foreground"
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
                  onClick={() => openChat(p.name)}
                  className="bg-gradient-brand flex h-10 items-center justify-center gap-1 rounded-xl text-xs font-bold text-primary-foreground"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </button>
                <button
                  onClick={() => setModal(`Voice Call na ${p.name}`)}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl border border-border bg-secondary text-xs font-bold"
                >
                  <Phone className="h-3.5 w-3.5" /> Voice Call
                </button>
                <button
                  onClick={() => setModal(`Video Call na ${p.name}`)}
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
          onClick={() => setModal("Install App")}
          className="bg-gradient-brand mt-3 h-12 w-full rounded-2xl text-sm font-bold text-primary-foreground shadow-glow"
        >
          Install App
        </button>
      </section>

      <PayoutToasts />

      {modal && <ActivateModal title={modal} onClose={() => setModal(null)} />}
    </main>
  );
}
