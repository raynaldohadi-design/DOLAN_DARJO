import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'sidebar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <span className="text-xs font-medium text-emerald-700">
          Terpasang sebagai Aplikasi PWA
        </span>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        className={
          variant === 'sidebar'
            ? 'w-full flex items-center justify-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/15 px-3 py-2 text-xs font-medium text-sky-100 hover:bg-sky-500/25 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'
            : 'inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-medium text-white hover:bg-[#13315C] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Pasang Aplikasi PWA</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1F3A] text-white">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h3 id="pwa-guide-title" className="text-base font-semibold text-slate-900">
                    Pasang DOLAN DARJO (PWA)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Akses cepat dari layar utama tanpa Play Store / App Store
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup panduan pasang PWA"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
              {isIOS ? (
                <>
                  <p className="font-semibold text-slate-900">Panduan untuk Perangkat iOS (Safari):</p>
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>Ketuk tombol <strong>Bagikan (Share)</strong> pada bilah navigasi Safari.</li>
                    <li>Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
                    <li>Ketuk <strong>Tambah (Add)</strong> untuk menyimpan ikon DOLAN DARJO.</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-900">Panduan Pemasangan Desktop & Android (Chrome / Edge):</p>
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>Klik ikon <strong>Install App</strong> di bilah alamat peramban atau buka menu titik tiga kanan atas.</li>
                    <li>Pilih <strong>Pasang Aplikasi (Install DOLAN DARJO)</strong>.</li>
                    <li>Aplikasi akan berjalan dalam mode layar penuh mandiri dengan dukungan cache offline.</li>
                  </ol>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-medium text-white hover:bg-[#13315C] transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Mode Offline — Menampilkan data cache operasional</span>
    </div>
  );
};
