import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PAYMENT_AMOUNT } from "@/lib/payment.functions";
import { getLocalUser } from "@/lib/local-auth";
import logo from "@/assets/talkswahili-logo.jpg";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Lipa — TALKSWAHILI" },
      { name: "description", content: "Lipia TALKSWAHILI kwa Lipa Namba kupitia mitandao ya simu." },
    ],
  }),
  component: PaymentPage,
});

const LIPA_NAMBA = "354136248";

function PaymentPage() {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [openOperator, setOpenOperator] = useState<string | null>(null);
  const ussdSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getLocalUser();
    if (!user) navigate({ to: "/register" });
  }, [navigate]);

  function startManualPayment() {
    setShowPopup(true);

    window.setTimeout(() => {
      setShowPopup(false);
      window.setTimeout(() => {
        ussdSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }, 1700);
  }

  function toggleOp(id: string) {
    setOpenOperator((current) => (current === id ? null : id));
  }

  async function copyText(text: string, button: HTMLButtonElement) {
    try {
      await navigator.clipboard.writeText(text);
      const oldText = button.textContent;
      button.textContent = "Copied!";
      window.setTimeout(() => {
        button.textContent = oldText || "Copy";
      }, 1400);
    } catch {
      window.prompt("Nakili LIPA NAMBA:", text);
    }
  }

  return (
    <div className="min-h-screen bg-[#07151f] font-jost text-white">
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
          <div className="manual-payment-popup w-full max-w-md rounded-[26px] border border-amber-300/20 bg-[#102532] p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 text-3xl">
              ⚠️
            </div>
            <h2 className="text-xl font-extrabold text-white">
              NJIA YA USSD PUSH HAIPATIKANI KWA SASA
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              TUMIA LIPA NAMBA
            </p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-pulse rounded-full bg-amber-400" />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <img
            src={logo}
            alt="TALKSWAHILI"
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div>
            <div className="text-lg font-extrabold text-white">TALKSWAHILI</div>
            <div className="text-xs text-slate-400">Hatua 2 kati ya 2</div>
          </div>
        </div>

        <section className="payment-main-card p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white">Lipa sasa</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            USSD Push haipatikani kwa sasa. Bonyeza Lipa sasa ili uone maelekezo
            ya kulipa kwa Lipa Namba.
          </p>

          <div className="mt-6 rounded-2xl bg-[#162d3c] p-5">
            <div className="text-xs text-slate-400">Kiasi cha kulipa</div>
            <div className="mt-1 text-3xl font-extrabold text-k-indigo">
              {PAYMENT_AMOUNT.toLocaleString()} TZS
            </div>
          </div>

          <button
            type="button"
            onClick={startManualPayment}
            className="k-btn-green mt-6 hover:opacity-90"
          >
            🔒 LIPA SASA
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-4 w-full rounded-xl border border-[#2a4555] bg-[#162d3c] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-[#1c394b]"
          >
            Rudi nyuma
          </button>
        </section>

        <div ref={ussdSectionRef} className="scroll-mt-6">
          <section className="section-card mt-7">
            <div className="ussd-header">
              <span>NJIA ZA MALIPO / USSD MENU</span>
              <div className="ussd-divider" />
            </div>

            <div className="payment-choice-heading">
              <div>
                <span className="payment-choice-kicker">LIPA NAMBA</span>
                <h2>Chagua Mtandao wako</h2>
                <p>
                  Chagua mtandao unaotumia kisha fuata hatua zilizoonyeshwa.
                </p>
              </div>
              <div className="lipa-number-pill">
                <span>LIPA NAMBA</span>
                <strong>{LIPA_NAMBA}</strong>
              </div>
            </div>

            <Operator
              id="op-voda"
              open={openOperator === "op-voda"}
              toggle={toggleOp}
              copyText={copyText}
              logoSrc="https://brandlogos.net/wp-content/uploads/2025/04/vodacom-logo_brandlogos.net_4uzfe.png"
              alt="Vodacom"
              name="Vodacom M-Pesa"
              ussd="*150*00#"
              steps={[
                <>Bonyeza <strong>*150*00#</strong></>,
                <>Chagua <strong>Lipa kwa M-PESA</strong></>,
                <>Chagua <strong>LIPA KWA SIMU HALOPESA</strong></>,
                <>Weka LIPA NAMBA: <span className="step-value">{LIPA_NAMBA}</span></>,
                <>Weka kiasi <strong>14,500 TZS</strong></>,
                <>Weka namba ya siri</>,
              ]}
              highlightIndex={3}
            />

            <Operator
              id="op-tigo"
              open={openOperator === "op-tigo"}
              toggle={toggleOp}
              copyText={copyText}
              logoSrc="https://www.uminolan.co.tz/assets/images/supa-agent/mixx-by-yas-seeklogo2.png"
              alt="Mixx by Yas"
              name="Mixx by Yas"
              ussd="*150*01#"
              steps={[
                <>Bonyeza <strong>*150*01#</strong></>,
                <>Chagua <strong>Lipa kwa simu</strong></>,
                <>Chagua <strong>Kwenda mitandao mingine</strong></>,
                <>Chagua <strong>HALOPESA</strong></>,
                <>Weka LIPA NAMBA: <span className="step-value">{LIPA_NAMBA}</span></>,
                <>Weka kiasi <strong>14,500 TZS</strong></>,
                <>Weka namba ya siri</>,
              ]}
              highlightIndex={4}
            />

            <Operator
              id="op-airtel"
              open={openOperator === "op-airtel"}
              toggle={toggleOp}
              copyText={copyText}
              logoSrc="https://nikulipe.com/wp-content/uploads/2022/09/Airtel_logo_PNG1.png"
              alt="Airtel"
              name="Airtel Money"
              ussd="*150*60#"
              steps={[
                <>Bonyeza <strong>*150*60#</strong></>,
                <>Chagua <strong>Lipia Bili</strong></>,
                <>Chagua <strong>LIPA KWA SIMU (MITANDAO YOTE)</strong></>,
                <>Chagua <strong>LIPA KWA HALOPESA</strong></>,
                <>Weka kiasi <strong>14,500 TZS</strong></>,
                <>Ingiza kumbukumbu ya malipo: <span className="step-value">{LIPA_NAMBA}</span></>,
                <>Ingiza namba ya siri kuruhusu muamala</>,
              ]}
              highlightIndex={5}
            />

            <Operator
              id="op-halo"
              open={openOperator === "op-halo"}
              toggle={toggleOp}
              copyText={copyText}
              logoSrc="https://halopesa.co.tz/images/applications-system.png"
              alt="Halopesa"
              name="Halopesa"
              ussd="*150*88#"
              steps={[
                <>Bonyeza <strong>*150*88#</strong></>,
                <>Chagua namba <strong>(5) Lipia Bidhaa</strong></>,
                <>Chagua <strong>HALOPESA</strong></>,
                <>Weka namba ya malipo: <span className="step-value">{LIPA_NAMBA}</span></>,
                <>Weka kiasi <strong>14,500 TZS</strong></>,
                <>Ingiza namba ya siri</>,
                <>Bonyeza <strong>1</strong> kuruhusu muamala</>,
              ]}
              highlightIndex={3}
            />

            <div className="biz-tag">
              Jina la Biashara: <strong>ASSERT BRIDGE</strong>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

type OperatorProps = {
  id: string;
  open: boolean;
  toggle: (id: string) => void;
  copyText: (text: string, button: HTMLButtonElement) => Promise<void>;
  logoSrc: string;
  alt: string;
  name: string;
  ussd: string;
  steps: React.ReactNode[];
  highlightIndex: number;
};

function Operator({
  id,
  open,
  toggle,
  copyText,
  logoSrc,
  alt,
  name,
  ussd,
  steps,
  highlightIndex,
}: OperatorProps) {
  return (
    <div className={`operator-item ${open ? "operator-open" : ""}`}>
      <button
        type="button"
        className="operator-toggle"
        onClick={() => toggle(id)}
        aria-expanded={open}
      >
        <div className="operator-logo-wrap">
          <img src={logoSrc} alt={alt} />
        </div>
        <div className="operator-copy">
          <div className="operator-name">{name}</div>
          <div className="operator-ussd">{ussd}</div>
        </div>
        <svg
          className="chevron"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="operator-steps">
          <ul className="steps-list">
            {steps.map((step, index) => (
              <li
                className={`step-row ${index === highlightIndex ? "highlight" : ""}`}
                key={index}
              >
                <span className="step-num">{index + 1}</span>
                <span className="step-content">
                  {step}
                  {index === highlightIndex && (
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        void copyText(LIPA_NAMBA, event.currentTarget);
                      }}
                    >
                      Copy
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="biz-tag">
            Jina la Biashara: <strong>ASSERT BRIDGE</strong>
          </div>
        </div>
      )}
    </div>
  );
}
