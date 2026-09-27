import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, Bell, CheckCircle2, LogOut, MessageCircle, Wallet, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { people } from "@/data/people";
import logo from "@/assets/talkswahili-logo.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TALKSWAHILI" }] }),
  component: DashboardPage,
});

type Profile = { id: string; full_name: string; phone: string; balance: number; activated: boolean; banned: boolean };
type Ledger = { amount: number; kind: string; description: string };
type Notification = { id: string; title: string; message: string; created_at: string; read_at: string | null };

function money(value: number) { return `TZS ${Number(value || 0).toLocaleString("en-US")}`; }

function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [amount, setAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { navigate({ to: "/login" }); return; }
    const [{ data, error: profileError }, { data: tx }, { data: notes }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,balance,activated,banned").eq("id", auth.user.id).single(),
      supabase.from("balance_transactions").select("amount,kind,description").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("id,title,message,created_at,read_at").or(`user_id.is.null,user_id.eq.${auth.user.id}`).is("read_at", null).order("created_at", { ascending: false }).limit(5),
    ]);
    if (profileError || !data) { setError(profileError?.message || "Profile haijapatikana."); setLoading(false); return; }
    if (!data.activated || data.banned) { navigate({ to: "/payment" }); return; }
    setProfile(data as Profile);
    setWithdrawPhone(data.phone || "");
    setLedger((tx as Ledger[]) ?? []);
    setNotifications((notes as Notification[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const rows = ledger;
    const bonus = rows.filter(x => x.kind === "admin_credit" && x.description.toLowerCase().includes("activation bonus")).reduce((s, x) => s + Math.max(0, Number(x.amount)), 0);
    const chatIncome = rows.filter(x => x.kind === "chat_reward").reduce((s, x) => s + Math.max(0, Number(x.amount)), 0);
    const withdrawn = rows.filter(x => x.kind === "withdrawal").reduce((s, x) => s + Math.abs(Number(x.amount)), 0);
    return { bonus, chatIncome, withdrawn, netIncome: bonus + chatIncome };
  }, [ledger]);

  async function dismissNotification(id: string) {
    const { error: updateError } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (updateError) return setError(updateError.message);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function withdraw(e: React.FormEvent) {
    e.preventDefault(); setError(""); setDone("");
    const n = Number(amount);
    if (!profile) return;
    if (n < 50000) return setError("Kiasi cha chini cha withdrawal ni TZS 50,000.");
    if (!/^\+?[0-9]{9,15}$/.test(withdrawPhone.replace(/\s/g, ""))) return setError("Namba ya simu si sahihi.");
    setLoading(true);
    const { error: rpcError } = await supabase.rpc("request_withdrawal", { p_amount: n, p_phone: withdrawPhone });
    setLoading(false);
    if (rpcError) return setError(rpcError.message);
    setDone(`Ombi la TZS ${n.toLocaleString()} limetumwa kwa admin kwa malipo.`);
    setAmount(""); await load();
  }

  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/" }); }

  if (loading && !profile) return <main className="grid min-h-screen place-items-center bg-[#f4f8fb] text-slate-500">Inapakia...</main>;
  if (!profile) return <main className="grid min-h-screen place-items-center bg-[#f4f8fb] px-5 text-red-600">{error || "Profile haijapatikana."}</main>;

  return (
    <div className="min-h-screen bg-[#f4f8fb] font-jost text-[#152033]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3"><img src={logo} alt="TALKSWAHILI" className="h-11 w-11 rounded-2xl object-contain" /><div><p className="text-lg font-extrabold">TALKSWAHILI</p><p className="text-xs text-slate-400">Dashboard ya Mtumiaji</p></div></div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-600"><LogOut className="h-4 w-4" /> Toka</button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-7">
        {notifications.length > 0 && (
          <section className="mb-6 space-y-3" aria-label="Notifications">
            {notifications.map(n => <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600"><Bell className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-extrabold">{n.title}</p><p className="mt-1 text-sm leading-5 text-slate-500">{n.message}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString("sw-TZ")}</p></div><button onClick={() => void dismissNotification(n.id)} aria-label="Funga notification" className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>)}
          </section>
        )}

        <section className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-xl font-extrabold text-white">{(profile.full_name || "M").slice(0,1).toUpperCase()}</div><div><h1 className="text-2xl font-extrabold sm:text-3xl">Karibu tena, {profile.full_name || "Mtumiaji"}</h1><p className="mt-1 text-sm text-slate-400">@{profile.full_name?.replace(/\s+/g, "").slice(0, 16) || "mtumiaji"} · Hivi ndivyo mapato yako yalivyo leo.</p></div></section>

        <section className="mt-6 rounded-[30px] bg-gradient-brand p-6 text-white shadow-lg sm:p-8">
          <p className="text-xs font-extrabold tracking-[0.25em] opacity-90">↗ NET INCOME</p>
          <p className="mt-3 text-4xl font-extrabold sm:text-5xl">{money(stats.netIncome)}</p>
          <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-3xl bg-white/15 p-4 backdrop-blur"><p className="text-xs font-bold uppercase opacity-75">Withdrawn</p><p className="mt-2 text-xl font-extrabold">{money(stats.withdrawn)}</p></div><div className="rounded-3xl bg-white/15 p-4 backdrop-blur"><p className="text-xs font-bold uppercase opacity-75">Bonus</p><p className="mt-2 text-xl font-extrabold">{money(stats.bonus)}</p></div></div>
        </section>

        <div className="mt-4 grid grid-cols-3 gap-3"><button onClick={() => { if (navigator.share) void navigator.share({ title: "TALKSWAHILI", text: "Jiunge na TALKSWAHILI." }); }} className="rounded-2xl bg-white px-3 py-4 text-sm font-extrabold shadow-sm">↗ Share</button><button onClick={() => navigate({ to: "/" })} className="rounded-2xl bg-white px-3 py-4 text-sm font-extrabold shadow-sm">👤 Chagua Chat</button><button onClick={() => document.getElementById("withdraw")?.scrollIntoView({ behavior: "smooth" })} className="rounded-2xl bg-white px-3 py-4 text-sm font-extrabold shadow-sm">▣ Cash Out</button></div>

        <section className="mt-5 rounded-[28px] border-l-4 border-teal-500 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-full bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-500">TALKSWAHILI</span><strong className="text-3xl">{Number(profile.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></div><p className="mt-5 text-xl text-slate-500">Balance</p><div className="mt-5 flex items-center justify-between text-sm text-slate-400"><span>Mapato ya sasa</span><span>{stats.netIncome > 0 ? "100%" : "0%"}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-brand" style={{ width: stats.netIncome > 0 ? "100%" : "0%" }} /></div></section>

        <section id="withdraw" className="mt-5 rounded-[28px] border-l-4 border-pink-500 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-full bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-500">TALKSWAHILI</span><strong className="text-3xl">{stats.withdrawn.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></div><p className="mt-5 text-xl text-slate-500">Withdrawal</p><p className="mt-2 text-sm text-slate-400">Minimum withdrawal: TZS 50,000. Malipo yanafanywa na admin.</p><form onSubmit={withdraw} className="mt-4 grid gap-3 sm:grid-cols-2"><input className="h-12 rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-teal-400" inputMode="numeric" placeholder="Kiasi cha kutoa" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} /><input className="h-12 rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-teal-400" inputMode="tel" placeholder="Namba ya kupokea" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value.replace(/[^0-9+]/g, ""))} /><button disabled={loading} className="sm:col-span-2 h-12 rounded-xl bg-slate-900 font-extrabold text-white disabled:opacity-60">{loading ? "Inatuma..." : "Omba Withdrawal"}</button></form>{error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}{done && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{done}</p>}</section>

        <section className="mt-8"><div className="flex items-end justify-between"><div><h2 className="text-xl font-extrabold">Chats</h2><p className="text-sm text-slate-400">Chagua mgeni na anza mazungumzo.</p></div><button onClick={() => navigate({ to: "/" })} className="text-sm font-extrabold text-teal-600">Tazama zote</button></div><div className="mt-4 space-y-3">{people.map((person, index) => <article key={`${person.name}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-center gap-3"><div className="relative shrink-0"><img src={person.avatar} alt={person.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-400/60" /><span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${person.online ? "bg-emerald-400" : "bg-slate-300"}`} /></div><div className="min-w-0 flex-1"><p className="truncate text-base font-extrabold">{person.flag} {person.name}, {person.age}</p><p className="truncate text-xs text-slate-400">{person.country} · <span className={person.online ? "font-bold text-emerald-500" : "font-bold text-slate-400"}>{person.online ? "Online" : "Offline"}</span></p><p className="mt-1 text-sm font-extrabold text-amber-500">{person.duration} — {person.pay}</p><p className="mt-1 truncate text-[11px] text-slate-400">Mada: {person.topic}</p><button disabled={!person.online} onClick={() => navigate({ to: "/chat", search: { person: person.name } })} className="mt-2 rounded-full bg-gradient-brand px-5 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><MessageCircle className="mr-1 inline h-3.5 w-3.5" /> Chat</button></div></div></article>)}</div></section>
      </main>
    </div>
  );
}
