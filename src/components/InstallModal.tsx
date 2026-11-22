interface InstallModalProps {
  open: boolean;
  canNativeInstall: boolean;
  isIos: boolean;
  onClose: () => void;
  onTriggerNativeInstall: () => void;
}

export function InstallModal({
  open,
  canNativeInstall,
  isIos,
  onClose,
  onTriggerNativeInstall,
}: InstallModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Installer KLAR som app"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <div
        className="animate-modal w-full max-w-md rounded-3xl border border-white/18 bg-[#091222]/95 p-6 shadow-[0_32px_90px_-20px_rgba(0,0,0,0.95)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="KLAR app-ikon"
              className="h-12 w-12 rounded-2xl border border-white/15 shadow-lg"
            />
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Installer KLAR som app
              </h2>
              <p className="text-xs font-medium text-slate-300">
                Fuldskærm, lynhurtig start & offline-cache
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Luk"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/14 bg-white/[0.06] text-slate-300 hover:bg-white/[0.14] hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {canNativeInstall ? (
            <>
              <p className="text-sm leading-relaxed text-slate-200">
                Din browser understøtter direkte PWA-installation. Tryk nedenfor
                for at føje <strong>KLAR</strong> direkte til din hjemmeskærm.
              </p>
              <button
                type="button"
                onClick={onTriggerNativeInstall}
                className="w-full rounded-2xl bg-white py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-slate-100 active:scale-[0.99]"
              >
                Installer på min enhed
              </button>
            </>
          ) : isIos ? (
            <ol className="space-y-2.5 text-sm text-slate-200">
              <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <span className="font-mono-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-400/20 text-xs font-bold text-sky-200">
                  1
                </span>
                <span>
                  Tryk på <strong>Del-ikonet</strong> (firkant med pil op) i
                  bunden af Safari.
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <span className="font-mono-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-400/20 text-xs font-bold text-sky-200">
                  2
                </span>
                <span>
                  Rul ned og vælg <strong>“Føj til hjemmeskærm”</strong>, og
                  tryk <strong>Tilføj</strong>.
                </span>
              </li>
            </ol>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-slate-200">
              Åbn browsermenuen (<strong>⋮</strong> i Chrome/Android eller{" "}
              <strong>Del</strong> i Safari/iOS) og vælg{" "}
              <strong>“Installer app”</strong> eller{" "}
              <strong>“Føj til hjemmeskærm”</strong>. Bemærk: PWA-installation
              kræver HTTPS (eller localhost under udvikling).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
