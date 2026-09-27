import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDownToLine, LogOut, MessageCircle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { people } from "@/data/people";
import logo from "@/assets/talkswahili-logo.jpg";

export const Route = createFileRoute("/dashboard")({ head: () => ({ meta: [{ title: "Dashboard — TALKSWAHILI" }] }), component: DashboardPage });

type Profile = { id: string; full_name: string; phone: string; balance: number; activated: boolean; banned: boolean; };
function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [amount, setAmount] = useState(""); const [withdrawPhone, setWithdrawPhone] = useState(""); const [error, setError] = useState(""); const [done, setDone] = useState(""); const [loading, setLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0); const [withdrawn, setWithdrawn] = useState(0);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { navigate({ to: "/login" }); return; }
    const { data, error } = await supabase.from("profiles").select("id,full_name,phone,balance,activated,banned").eq("id", auth.user.id).single();
    if (error || !data) { setError(error?.message || "Profile haijapatikana."); setLoading(false); return; }
    if (!data.activated || data.banned) { navigate({ to: "/payment" }); return; }
    setProfile(data as Profile); setWithdrawPhone(data.phone || "");
    const { data: tx } = await supabase.from("balance_transactions").select("amount,kind").eq("user_id", auth.user.id);
    const rows = (tx ?? []) as {amount:number;kind:string}[];
    setWithdrawn(rows.filter(x => x.kind === "withdrawal").reduce((s,x) => s + Math.abs(Number(x.amount)),0));
    setMessageCount(rows.filter(x => x.kind === "chat_reward").length * 10);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function withdraw(e: React.FormEvent) {
    e.preventDefault(); setError(""); setDone("");
    const n = Number(amount);
    if (!profile) return;
    if (n < 50000) return setError("Kiasi cha chini cha withdrawal ni TZS 50,000.");
    if (!/^\+?[0-9]{9,15}$/.test(withdrawPhone.replace(/\s/g, ""))) return setError("Namba ya simu si sahihi.");
    setLoading(true);
    const { error } = await supabase.rpc("request_withdrawal", { p_amount: n, p_phone: withdrawPhone });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(`Withdrawal ya TZS ${n.toLocaleString()} imepokelewa na admin.`);
    setAmount(""); await load();
  }
  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/" }); }

  if (loading && !profile) return <main className="flex min-h-screen items-center justify-center bg-[#07151f] text-slate-400">Inapakia...</main>;
  if (!profile) return <main className="flex min-h-screen items-center justify-center bg-[#07151f] text-red-200">{error || "Profile haijapatikana."}</main>;
  return <div className="min-h-screen bg-[#07151f] font-jost text-white"><header className="flex items-center justify-between bg-[#0b202c] px-4 py-4 sm:px-6"><div className="flex items-center gap-2"><img src={logo} alt="TALKSWAHILI" className="h-9 w-9 rounded-xl object-contain" /><span className="text-lg font-extrabold text-white">TALKSWAHILI</span></div><button onClick={signOut} className="flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white"><LogOut className="h-3.5 w-3.5" /> Toka</button></header>
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-white">Karibu, {profile.full_name || "Member"}</h1><p className="mt-1 text-sm text-slate-400">Akaunti yako imeanzishwa na malipo yamethibitishwa.</p></div><button onClick={() => navigate({ to: "/" })} className="rounded-xl bg-k-indigo px-4 py-2 text-sm font-bold text-white">Chagua Chat</button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><Stat label="Salio" value={`TZS ${Number(profile.balance).toLocaleString()}`} icon={<Wallet className="h-4 w-4" />} /><Stat label="Pesa Iliyotolewa" value={`TZS ${withdrawn.toLocaleString()}`} icon={<ArrowDownToLine className="h-4 w-4" />} /><Stat label="Chat sessions" value={String(messageCount / 10)} icon={<MessageCircle className="h-4 w-4" />} /></div>
      <section className="mt-8 k-card p-6"><h2 className="font-bold text-white">Toa Pesa</h2><p className="mt-1 text-sm text-slate-400">Minimum withdrawal ni TZS 50,000; ombi la withdrawal linapelekwa kwa admin.</p><form onSubmit={withdraw} className="mt-5 grid gap-3 sm:grid-cols-2"><input className="k-field" inputMode="numeric" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} /><input className="k-field" inputMode="tel" placeholder="Namba ya simu" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value.replace(/[^0-9+]/g, ""))} /><button disabled={loading} className="k-btn sm:col-span-2 disabled:opacity-60">{loading ? "Inatuma..." : "Toa Pesa"}</button></form>{error && <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}{done && <p className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{done}</p>}</section>
      <section className="mt-8 k-card p-6"><h2 className="font-bold text-white">Endelea kuchat</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{people.filter(p => p.online).slice(0, 6).map(p => <button key={p.name} onClick={() => navigate({ to: "/chat", search: { person: p.name } })} className="flex items-center justify-between rounded-2xl border border-[#2a4555] bg-[#162d3c] p-4 text-left"><span><span className="block font-bold">{p.flag} {p.name}, {p.age}</span><span className="text-xs text-emerald-300">Online • {p.pay}</span></span><MessageCircle className="h-5 w-5 text-teal-400" /></button>)}</div></section>
    </main></div>;
}
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-2xl border-[1.5px] border-[#2a4555] bg-[#162d3c] px-5 py-4"><div className="flex items-center justify-between text-xs text-slate-400"><span>{label}</span><span>{icon}</span></div><div className="mt-1 text-lg font-bold text-white">{value}</div></div>; }
