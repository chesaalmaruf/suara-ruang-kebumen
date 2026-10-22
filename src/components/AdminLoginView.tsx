import React, { useState } from 'react';

interface AdminLoginViewProps {
  onLoginSuccess: (officerName: string) => void;
  onBackToCitizen: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToCitizen,
}) => {
  const [username, setUsername] = useState('admin.pupr@kebumenkab.go.id');
  const [password, setPassword] = useState('kebumen2025');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Valid credentials check
      if (
        (username.trim() === 'admin.pupr@kebumenkab.go.id' ||
          username.trim() === 'admin_pupr' ||
          username.trim() === 'admin') &&
        (password === 'kebumen2025' || password === 'admin123')
      ) {
        onLoginSuccess('Ir. Budi Santoso (Koordinator Lapangan)');
      } else {
        setErrorMsg('Email atau kata sandi tidak valid. Gunakan akun demo di bawah.');
      }
    }, 600);
  };

  const handleFillDemo = () => {
    setUsername('admin.pupr@kebumenkab.go.id');
    setPassword('kebumen2025');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#eaedff] space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#00355f] text-white flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-[36px] text-[#7fc5fd]">
              admin_panel_settings
            </span>
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-[#006496] uppercase tracking-widest">
              PEMKAB KEBUMEN
            </span>
            <h2 className="text-xl font-black text-[#131b2e] leading-tight">
              Portal Dinas PUPR & Dishub
            </h2>
            <p className="text-xs text-[#42474f] mt-1">
              Sistem Manajemen Aksesibilitas & Penugasan Lapangan SPK SAW
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-[#ffdad6] text-[#93000a] text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in border border-[#ba1a1a]/20">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="admin-username"
              className="block text-xs font-bold text-[#131b2e]"
            >
              Email / NIP Pengawas
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#006496] text-[18px]">
                badge
              </span>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="admin.pupr@kebumenkab.go.id"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f2f3ff] text-xs font-semibold text-[#131b2e] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-transparent focus:border-[#00355f] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="admin-password"
              className="block text-xs font-bold text-[#131b2e]"
            >
              Kata Sandi
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#006496] text-[18px]">
                lock
              </span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f2f3ff] text-xs font-semibold text-[#131b2e] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-transparent focus:border-[#00355f] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#727780] hover:text-[#131b2e] focus:outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-75"
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            ) : (
              <>
                <span>Masuk sebagai Petugas Dinas</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="p-3 bg-[#eaedff] rounded-2xl border border-[#cce5ff] space-y-2 text-center">
          <div className="text-[11px] text-[#00517b] font-bold">
            Akun Demo Petugas PUPR Kebumen:
          </div>
          <div className="text-[11px] font-mono text-[#00355f] bg-white py-1 px-2 rounded-lg inline-block border border-[#dae2fd]">
            admin.pupr@kebumenkab.go.id • kebumen2025
          </div>
          <div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] text-[#006496] font-bold underline hover:text-[#00355f]"
            >
              Isi Otomatis Akun Demo
            </button>
          </div>
        </div>

        {/* Back to Citizen Portal */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBackToCitizen}
            className="text-xs font-bold text-[#006496] hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Kembali ke Portal Warga (/)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
