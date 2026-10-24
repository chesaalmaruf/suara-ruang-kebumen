import React, { useState } from 'react';
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  UserCheck,
} from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (username: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const cleanUser = username.trim();
      if (
        (cleanUser === 'admin_pupr' && password === 'kebumen2025') ||
        (cleanUser === 'admin' && password === 'admin123')
      ) {
        setIsLoading(false);
        onLoginSuccess(cleanUser);
      } else {
        setIsLoading(false);
        setErrorMsg(
          'Username atau kata sandi tidak valid. Gunakan kredensial resmi Pengawas Dinas PUPR.'
        );
      }
    }, 250);
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 text-slate-900">
      {/* Left Institutional Panel (Desktop / Large Screens) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative overflow-hidden bg-gradient-to-br from-[#eaf2fb] via-[#f4f8fd] to-[#e3eef9] text-[#0B192C] flex-col justify-between p-10 xl:p-14 border-r border-slate-200/90">
        {/* Soft luminous radial backdrop behind transparent blue logo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/80 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-12 right-8 w-80 h-80 rounded-full bg-amber-200/25 blur-3xl"
        />

        <div className="relative z-10 max-w-xl space-y-7 my-auto py-8">
          {/* Transparent Logo Display */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 xl:w-28 xl:h-28 rounded-3xl bg-white/90 backdrop-blur-sm border border-white shadow-[0_14px_34px_rgba(0,53,95,0.10)] p-3.5 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/Logo_SUARA_RUANG_tanpa_teks_transparan_1d640663.png"
                alt="Logo Suara Ruang"
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-2xl xl:text-3xl font-extrabold tracking-tight text-[#00355f]">
                SUARA RUANG
              </span>
              <span className="block text-xs font-semibold uppercase tracking-widest text-slate-600">
                Sistem Pemetaan Aksesibilitas Publik
              </span>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#005187]">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Dinas Pekerjaan Umum dan Penataan Ruang · Kabupaten Kebumen</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-[#0B192C] leading-tight [text-wrap:balance]">
              Pusat Kendali Verifikasi & Disposisi Aksesibilitas Ruang Publik
            </h1>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-600 border-t border-slate-300/60 pt-5">
          <span className="font-medium">SUARA RUANG · Sistem Informasi Aksesibilitas Terpadu</span>
          <span className="font-mono tabular-nums font-semibold text-[#00355f]">
            Kabupaten Kebumen
          </span>
        </div>
      </div>

      {/* Right Login Form Surface (All Devices) */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-5 sm:p-8 lg:p-12 bg-white">
        {/* Mobile/Tablet Top Navigation */}
        <div className="flex items-center justify-end lg:hidden">
          <span className="text-xs font-mono text-slate-500">Dinas PUPR Kebumen</span>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-6 space-y-7">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#005187]">
              Portal Pengawas Pemerintah Daerah
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              Masuk ke Ruang Kendali Admin
            </h2>
            <p className="text-sm text-slate-600">
              Gunakan akun pengawas resmi Dinas PUPR untuk memvalidasi laporan warga dan menerbitkan
              Surat Perintah Kerja (SPK).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium leading-relaxed"
              >
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="admin-username"
                className="block text-xs font-semibold text-slate-800"
              >
                Username Pengawas
              </label>
              <div className="relative flex items-center">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="admin_pupr"
                  className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00355f] focus:ring-2 focus:ring-[#00355f]/15 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-800"
              >
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  className="w-full h-11 pl-10 pr-11 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00355f] focus:ring-2 focus:ring-[#00355f]/15 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-2.5 p-1.5 text-slate-500 hover:text-slate-800 rounded-md"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#00355f] focus:ring-[#00355f]"
                />
                <span>Ingat sesi perangkat ini</span>
              </label>
              <span className="text-xs text-slate-500 font-mono">Otentikasi Pengawas</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 px-4 rounded-lg bg-[#00355f] hover:bg-[#004880] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 whitespace-nowrap"
              >
                {isLoading ? (
                  <span>Memverifikasi Kredensial...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Portal Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <footer className="text-center lg:text-left text-xs text-slate-500 pt-4 border-t border-slate-100">
          Pemerintah Kabupaten Kebumen · Dinas Pekerjaan Umum dan Penataan Ruang
        </footer>
      </div>
    </div>
  );
};
