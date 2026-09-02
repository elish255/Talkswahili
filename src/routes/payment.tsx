import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkPaymentStatus, PAYMENT_AMOUNT, startPayment } from "@/lib/payment.functions";
import { getLocalUser, updateLocalUser } from "@/lib/local-auth";
import logo from "@/assets/talkswahili-logo.png";

export const Route = createFileRoute("/payment")({
  head: () => ({ meta: [{ title: "Lipa — TALKSWAHILI" }, { name: "description", content: "Lipia TALKSWAHILI kwa USSD Push moja kwa moja kwenye simu yako." }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const navigate = useNavigate();
  const callStart = useServerFn(startPayment);
  const callCheck = useServerFn(checkPaymentStatus);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle"|"waiting"|"success"|"error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => { const user = getLocalUser(); if (!user) navigate({ to: "/register" }); else setPhone(user.phone); return () => { if (timer.current) window.clearInterval(timer.current); }; }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatus("idle"); setMessage("");
    const user = getLocalUser(); if (!user) { navigate({ to: "/register" }); return; }
    try {
      const result = await callStart({ data: { phone, name: user.name, email: user.email } });
      localStorage.setItem("talkswahili_pending_order", result.order_id);
      if (result.reference) localStorage.setItem("talkswahili_payment_reference", result.reference);
      setStatus("waiting"); setMessage(result.message); setLoading(false);
      let attempts = 0;
      timer.current = window.setInterval(async () => {
        attempts++;
        try {
          const s = await callCheck({ data: { orderId: result.order_id } });
          if (s.payment_status === "COMPLETED" || s.payment_status === "SUCCESS") {
            if (timer.current) window.clearInterval(timer.current);
            updateLocalUser({ paid: true }); setStatus("success"); setMessage("Malipo yamefanikiwa. Karibu TALKSWAHILI!");
            window.setTimeout(() => navigate({ to: "/dashboard" }), 900);
          } else if (["FAILED", "CANCELLED", "REJECTED"].includes(s.payment_status)) {
            if (timer.current) window.clearInterval(timer.current); setStatus("error"); setMessage(s.message || "Malipo hayajakamilika. Jaribu tena.");
          }
        } catch { if (attempts >= 12 && timer.current) { window.clearInterval(timer.current); setStatus("error"); setMessage("Hatukupata uthibitisho bado. Angalia simu yako au jaribu tena."); } }
        if (attempts >= 24 && timer.current) { window.clearInterval(timer.current); setStatus("error"); setMessage("Muda wa kusubiri umeisha. Kama umelipa, jaribu kuangalia tena."); }
      }, 5000);
    } catch (err) { setLoading(false); setStatus("error"); setMessage(err instanceof Error ? err.message : "Imeshindikana kuanzisha malipo."); }
  }

  return <div className="min-h-screen bg-k-slate-50 font-jost text-k-slate-800"><main className="mx-auto max-w-xl px-4 py-10">
    <div className="mb-6 flex items-center gap-3"><img src={logo} alt="TALKSWAHILI" className="h-10 w-10 rounded-xl object-contain" /><div><div className="text-lg font-extrabold text-k-slate-900">TALKSWAHILI</div><div className="text-xs text-k-slate-500">Hatua 2 kati ya 2</div></div></div>
    <section className="k-card p-6 md:p-8"><h1 className="text-2xl font-bold text-k-slate-900">Lipa sasa</h1><p className="mt-2 text-sm text-k-slate-500">Thibitisha malipo ya akaunti yako kwa USSD Push.</p>
      <div className="mt-6 rounded-2xl bg-k-slate-50 p-5"><div className="text-xs text-k-slate-500">Kiasi cha kulipa</div><div className="mt-1 text-3xl font-extrabold text-k-indigo">{PAYMENT_AMOUNT.toLocaleString()} TZS</div></div>
      {status === "waiting" ? <div className="mt-6 rounded-2xl border border-k-amber-100 bg-k-amber-100/60 p-5"><div className="font-bold text-k-slate-900">Push imetumwa</div><p className="mt-1 text-sm text-k-slate-700">{message} Ingiza namba yako ya siri kuthibitisha malipo.</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full w-1/2 animate-pulse rounded-full bg-k-indigo" /></div></div> : <form onSubmit={onSubmit} className="mt-6"><label className="mb-1 block text-xs font-bold text-k-slate-500">Namba ya simu</label><div className="mb-4 flex items-center overflow-hidden rounded-xl border-[1.5px] border-k-slate-200 bg-k-slate-50"><span className="border-r border-k-slate-200 px-3 py-3 text-sm text-k-slate-500">🇹🇿 +255</span><input type="tel" required maxLength={15} placeholder="06XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} className="w-full bg-transparent px-3 py-3 text-sm outline-none" /></div>{status === "error" && <div className="mb-4 rounded-xl border border-k-red-300 bg-k-red-50 px-4 py-3 text-sm text-k-red-900">{message}</div>}<button disabled={loading} type="submit" className="k-btn-green hover:opacity-90 disabled:opacity-60">{loading ? "Inatuma Push..." : "🔒 LIPA SASA"}</button></form>}
      {status === "success" && <div className="mt-5 rounded-xl bg-k-green-100 px-4 py-3 text-sm font-semibold text-k-green-800">{message}</div>}
      <button onClick={() => navigate({ to: "/" })} className="mt-4 w-full rounded-xl border border-k-slate-200 bg-white px-4 py-3 text-sm font-semibold text-k-slate-700">Rudi nyuma</button>
    </section>
  </main></div>;
}
