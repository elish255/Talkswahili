import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Wallet, ArrowDownToLine } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TALKSWAHILI" }, { name: "description", content: "Dashboard ya TALKSWAHILI." }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const raw = localStorage.getItem("talkswahili_user");
    if (!raw) navigate({ to: "/register" });
    else setUser(JSON.parse(raw));
  }, [navigate]);
  if (!user) return <main className="flex min-h-screen items-center justify-center bg-k-slate-50">Inapakia...</main>;
  return <main className="min-h-screen bg-k-slate-50 font-jost text-k-slate-800">
    <header className="flex items-center justify-between bg-k-green-900 px-5 py-4 text-white">
      <button onClick={() => navigate({ to: "/" })} className="flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4"/> Home</button>
      <b>TALKSWAHILI</b>
      <button onClick={() => { localStorage.removeItem("talkswahili_user"); navigate({to:"/"}); }}><LogOut className="h-4 w-4"/></button>
    </header>
    <section className="mx-auto max-w-xl px-4 py-6">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm text-k-slate-500">Karibu, {user.name}</p>
        <h1 className="mt-1 text-2xl font-extrabold">Dashboard</h1>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-k-green-50 p-4"><Wallet className="h-5 w-5 text-k-green-700"/><p className="mt-3 text-xs text-k-slate-500">Salio</p><b>TZS {Number(user.balance||0).toLocaleString()}</b></div>
          <div className="rounded-2xl bg-k-amber-100 p-4"><ArrowDownToLine className="h-5 w-5 text-k-amber-500"/><p className="mt-3 text-xs text-k-slate-500">Pesa Iliyotolewa</p><b>TZS {Number(user.withdrawn||0).toLocaleString()}</b></div>
        </div>
        <button onClick={() => navigate({to:"/"})} className="k-btn-green mt-5">Endelea Kuchat</button>
        <p className="mt-4 text-center text-xs text-k-slate-500">Baada ya kila ujumbe 10 unaostahili malipo, salio litaongezwa kulingana na malipo ya mgeni.</p>
      </div>
    </section>
  </main>;
}
