import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
          {people.map((p, i) => (
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
                  onClick={() => setModal(`Chat na ${p.name}`)}
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
    </main>
  );
}
