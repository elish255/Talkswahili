import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownToLine,
  Headphones,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  TrendingUp,
  Video,
  Wallet,
  X,
} from "lucide-react";

import logo from "@/assets/talkswahili-logo.jpg";
import { PayoutToasts } from "@/components/PayoutToasts";
import { people, reviews, withdrawals } from "@/data/people";
import { getLocalUser } from "@/lib/local-auth";

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
        content:
          "TALKSWAHILI, Talkswahili, Talk Swahili, TALKSWAHILI Live, talkswahililive.site, chat na wageni, kuchat na wazungu, kazi online Tanzania, kipato online Tanzania, Kiswahili ni Fursa, voice call, video call, chat Tanzania",
      },
      { property: "og:title", content: "TALKSWAHILI — Chati na Wageni, Lipwa Papo Hapo" },
      {
        property: "og:description",
        content:
          "Chati na Wazungu waliopo mtandaoni, fuatilia mapato yako na toa pesa kupitia dashibodi ya TALKSWAHILI.",
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
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h3 className="text-base font-extrabold">{title}</h3>
          </div>
          <button aria-label="Funga" onClick={onClose} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {isInstall
            ? "TALKSWAHILI inaweza kuwekwa kwenye home screen ya simu yako kwa matumizi ya haraka."
            : `${title} inapatikana baada ya akaunti yako kusajiliwa na malipo kuthibitishwa.`}
        </p>
        {!isInstall && (
          <button
            onClick={() => navigate({ to: "/register" })}
            className="bg-gradient-gold mt-4 flex h-12 w-full items-center justify-center rounded-2xl text-sm font-extrabold text-gold-foreground"
          >
            Jisajili Sasa
          </button>
        )}
        <button onClick={onClose} className="mt-2 h-11 w-full rounded-2xl border border-border bg-secondary text-sm font-semibold">
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
  const classes = {
    primary: "border-primary/30 bg-primary/10 text-primary",
    accent: "border-accent/35 bg-accent/10 text-accent",
    gold: "border-gold/35 bg-gold/10 text-gold",
  }[tone];

  return (
    <div className={`flex min-h-[148px] flex-col justify-between rounded-3xl border p-4 ${classes}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/70">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl">{value}</p>
      <div className="mt-3 h-10">{action ?? <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>
    </div>
  );
}

function Index() {
  const [modal, setModal] = useState<string | null>(null);
  const navigate = useNavigate();

  const openChat = (name: string) => {
    navigate({ to: "/chat", search: { person: name } });
  };

  const registerOrDashboard = () => {
    const user = getLocalUser();
    navigate({ to: user?.paid ? "/dashboard" : "/register" });
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
            className="h-11 w-11 rounded-2xl bg-white object-contain shadow-glow"
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

      {/* Same two-button header layout as the uploaded talkswahili.live site. */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setModal("Install App")}
          className="bg-gradient-brand flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground shadow-glow"
        >
          <img src={logo} alt="" width={24} height={24} className="h-6 w-6 rounded-lg bg-white object-contain" />
          Install App
        </button>
        <a
          href="#huduma"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-secondary text-sm font-bold"
        >
          <Headphones className="h-4 w-4" /> Customer Care
        </a>
      </div>

      <section className="mt-5 rounded-3xl border border-primary/25 bg-card p-5" aria-labelledby="talkswahili-intro-title">
        <h2 id="talkswahili-intro-title" className="text-xl font-extrabold tracking-tight">
          TALKSWAHILI — Chati na Wageni kwa Kiswahili
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          TALKSWAHILI ni jukwaa la Tanzania la kuwasiliana na wageni kupitia chat, voice call na video call.
          Unaweza kuona watu waliopo mtandaoni, kuanza mazungumzo, kufuatilia balance yako na kutumia dashibodi ya TALKSWAHILI.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
          <span className="rounded-full bg-secondary px-3 py-1.5">TALKSWAHILI Live</span>
          <span className="rounded-full bg-secondary px-3 py-1.5">Chat na Wageni</span>
          <span className="rounded-full bg-secondary px-3 py-1.5">Kiswahili ni Fursa</span>
          <span className="rounded-full bg-secondary px-3 py-1.5">Tanzania</span>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
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

      <button
        onClick={registerOrDashboard}
        className="bg-gradient-brand mt-3 flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-primary-foreground shadow-glow"
      >
        Jisajili Sasa
      </button>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Wazungu</h2>
        <p className="text-xs text-muted-foreground">
          Waliopo mtandaoni hujibu chati na malipo hutolewa. Wasiokuwepo hawajibu.
        </p>

        <div className="mt-4 space-y-3">
          {people.map((person, index) => (
            <article key={`${person.name}-${index}`} className="card-surface flex items-center gap-3 rounded-3xl p-3">
              <div className="relative shrink-0">
                <img
                  src={person.avatar}
                  alt={`Picha ya ${person.name} kutoka ${person.country}`}
                  loading="lazy"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-success/60"
                />
                <span
                  className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card ${
                    person.online ? "pulse-dot bg-success" : "bg-muted-foreground"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  <span className="mr-1" aria-hidden="true">{person.flag}</span>
                  {person.name}, {person.age}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {person.country} •{" "}
                  <span className={person.online ? "font-bold text-success" : "font-bold text-destructive"}>
                    {person.online ? "Online" : "Offline"}
                  </span>
                </p>
                <p className="mt-1 text-[13px] font-extrabold text-gold">
                  {person.duration} — {person.pay}
                </p>

                <div className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => openChat(person.name)}
                    className="bg-gradient-brand flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold text-primary-foreground"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </button>
                  <button
                    onClick={() => setModal(`Voice Call na ${person.name}`)}
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/20 px-2.5 text-[10px] font-bold text-accent"
                  >
                    <Phone className="h-3.5 w-3.5" /> Voice Call
                  </button>
                  <button
                    onClick={() => setModal(`Video Call na ${person.name}`)}
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-violet/40 bg-violet/20 px-2.5 text-[10px] font-bold text-violet"
                  >
                    <Video className="h-3.5 w-3.5" /> Video Call
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="huduma" className="mt-8 rounded-3xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Huduma kwa Wateja</h2>
        <p className="mt-1 text-xs text-muted-foreground">Una swali au changamoto? Wasiliana nasi moja kwa moja.</p>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-brand mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp: {WHATSAPP_NUMBER}
        </a>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Miamala ya Hivi Karibuni</h2>
        <div className="mt-3 h-40 overflow-hidden rounded-3xl border border-border bg-card p-4">
          <div className="marquee-up space-y-3">
            {[...withdrawals, ...withdrawals].map((item, index) => (
              <p key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-success" />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Rating na Maoni ya Watumiaji</h2>
        <p className="mt-1 text-xs text-muted-foreground">Maoni halisi kutoka kwa waliolipwa Talkswahili</p>
        <div className="mt-3 rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-extrabold text-gold">4.7</p>
              <p className="text-[11px] text-muted-foreground">1308+ maoni</p>
            </div>
            <div className="flex gap-0.5 text-gold">
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {reviews.map((review) => (
            <article key={review.name} className="rounded-2xl border border-border bg-secondary/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {review.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-[13px] font-bold leading-tight">{review.name}</p>
                    <p className="text-[10px] text-muted-foreground">{review.city}</p>
                  </div>
                </div>
                <span className="flex gap-0.5 text-gold">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{review.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-border bg-card p-5" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-lg font-bold">Kuhusu TALKSWAHILI</h2>
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <h3 className="font-bold">TALKSWAHILI ni nini?</h3>
            <p className="mt-1 leading-6 text-muted-foreground">
              TALKSWAHILI ni platform ya chat na wageni inayolenga watumiaji wa Tanzania na wanaozungumza Kiswahili.
            </p>
          </div>
          <div>
            <h3 className="font-bold">Ninaanzaje kutumia TALKSWAHILI?</h3>
            <p className="mt-1 leading-6 text-muted-foreground">
              Jisajili kupitia mfumo wa TALKSWAHILI, fuata hatua za malipo ya USSD Push, kisha tumia dashibodi kuendelea na huduma zinazopatikana.
            </p>
          </div>
          <div>
            <h3 className="font-bold">Naweza kupata TALKSWAHILI wapi?</h3>
            <p className="mt-1 leading-6 text-muted-foreground">
              Tovuti hii ndiyo ukurasa rasmi wa TALKSWAHILI Live. Tumia anwani hii unapoitafuta TALKSWAHILI kwenye Google.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-primary/30 bg-primary/10 p-5 text-center">
        <h2 className="text-base font-bold">Weka Talkswahili kwenye simu yako</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Gusa hapa chini ili app ijiweke kwenye home screen — kuingia kwa haraka muda wowote.
        </p>
        <button
          onClick={() => setModal("Install App")}
          className="bg-gradient-brand mx-auto mt-4 flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl text-base font-extrabold text-primary-foreground shadow-glow"
        >
          <img src={logo} alt="" width={28} height={28} className="h-7 w-7 rounded-lg bg-white object-contain" />
          Install App
        </button>
      </section>

      <PayoutToasts />
      {modal && <ActivateModal title={modal} onClose={() => setModal(null)} />}
    </main>
  );
}
