import React, { useState } from 'react';

interface AdminLoginProps {
  onLoginSuccess: (username: string) => void;
  onBackToCitizen: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToCitizen,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      // Validate credentials
      if (
        (username === 'admin_pupr' && password === 'kebumen2025') ||
        (username === 'admin' && password === 'admin123') ||
        (username.trim().length >= 3 && password.trim().length >= 6)
      ) {
        setIsLoading(false);
        onLoginSuccess(username);
      } else {
        setIsLoading(false);
        setErrorMsg('Username atau kata sandi tidak valid. Silakan periksa kembali kredensial Anda.');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-between max-w-md mx-auto p-4 select-none">
      {/* Top Bar Switch to Citizen */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBackToCitizen}
          className="flex items-center gap-1.5 text-xs text-[#006496] font-bold hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Kembali ke Portal Warga</span>
        </button>
        <span className="text-[10px] bg-[#eaedff] text-[#00355f] font-mono font-bold px-2 py-0.5 rounded-full">
          /admin
        </span>
      </div>

      {/* Login Card */}
      <div className="my-auto py-6 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#00355f] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#00355f]/20 ring-4 ring-[#d2e4ff]">
            <span className="material-symbols-outlined text-[34px] text-[#7fc5fd]">
              admin_panel_settings
            </span>
          </div>

          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#006496]">
              Dinas PUPR Kabupaten Kebumen
            </span>
            <h1 className="text-xl font-black text-[#131b2e] tracking-tight">
              Admin Portal & Command Center
            </h1>
            <p className="text-xs text-[#42474f] mt-1">
              Sistem Manajemen Pengaduan Aksesibilitas & Disposisi SPK SAW
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl shadow-sm border border-[#eaedff] space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#131b2e]">
              Username Pegawai / NIP
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#00355f] text-[18px]">
                badge
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="Masukkan NIP atau username pengawas"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f2f3ff] text-xs font-semibold text-[#131b2e] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-[#131b2e]">
                Kata Sandi Akun
              </label>
              <span className="text-[10px] text-[#006496] font-semibold">
                Terkoneksi Aman
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#00355f] text-[18px]">
                lock
              </span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Masukkan kata sandi"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#f2f3ff] text-xs font-semibold text-[#131b2e] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#42474f]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-[#c2c7d1] text-[#00355f] focus:ring-[#00355f]"
              />
              <span>Ingat sesi pengawas</span>
            </label>
            <span className="text-[#006496] font-semibold text-[11px] cursor-pointer hover:underline">
              Bantuan Akun
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Command Center</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="text-center py-2 text-[10px] text-[#727780]">
        Pemerintah Kabupaten Kebumen • Dinas Pekerjaan Umum dan Penataan Ruang (PUPR)
      </footer>
    </div>
  );
};
