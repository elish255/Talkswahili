import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Volume2, VolumeX, X } from "lucide-react";

const payers: Array<[string, string, string]> = [
  ["Juma Mwanri", "TZS 150,000", "M-Pesa"],
  ["Amina Kessy", "TZS 270,000", "Tigo Pesa"],
  ["Baraka Lyimo", "TZS 85,000", "Airtel Money"],
  ["Neema Shayo", "TZS 108,000", "HaloPesa"],
  ["Joseph Mwakalinga", "TZS 65,000", "M-Pesa"],
  ["Sarah Mollel", "TZS 120,000", "M-Pesa"],
  ["Emmanuel Chuwa", "TZS 50,000", "Tigo Pesa"],
  ["Halima Juma", "TZS 195,000", "Airtel Money"],
  ["Frank Mbwilo", "TZS 30,000", "M-Pesa"],
  ["Zainabu Ally", "TZS 240,000", "HaloPesa"],
];

type ToastItem = { id: number; name: string; amount: string; method: string };

function playDing(muted: boolean) {
  if (muted) return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    gain.connect(ctx.destination);

    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      osc.connect(gain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.35);
    });
    setTimeout(() => void ctx.close(), 900);
  } catch {
    /* sauti haipatikani */
  }
}

export function PayoutToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const idx = useRef(0);
  const counter = useRef(0);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const stored = localStorage.getItem("ts-toast-muted");
    if (stored === "1") setMuted(true);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const push = () => {
      const [name, amount, method] = payers[idx.current % payers.length]!;
      idx.current += 1;
      const id = ++counter.current;
      setToasts((prev) => [{ id, name, amount, method }, ...prev].slice(0, 3));
      playDing(mutedRef.current);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5200);
      timeout = setTimeout(push, 7000 + Math.random() * 5000);
    };

    timeout = setTimeout(push, 3500);
    return () => clearTimeout(timeout);
  }, []);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem("ts-toast-muted", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-success/40 bg-card/95 p-3 shadow-glow backdrop-blur"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold">{t.name} amelipwa</p>
            <p className="truncate text-[11px] text-muted-foreground">
              <span className="font-bold text-gold">{t.amount}</span> kupitia {t.method}
            </p>
          </div>
          <button
            aria-label={muted ? "Washa sauti" : "Zima sauti"}
            onClick={toggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            aria-label="Funga"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
