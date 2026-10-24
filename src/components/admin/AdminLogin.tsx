import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  ShieldCheck,
  UserCheck,
  Zap,
} from 'lucide-react';

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

  const handleQuickLogin = () => {
    setUsername('admin_pupr');
    setPassword('kebumen2025');
    onLoginSuccess('admin_pupr');
  };

  return (
    <div className="w-full min-h-[calc(100vh-36px)] grid grid-cols-1 lg:grid-cols-12 bg-slate-50 text-slate-900">
      {/* Left Institutional Panel (Desktop / Large Screens) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-[#0B192C] text-white flex-col justify-between p-10 xl:p-14 border-r border-slate-800">
        <div>
          <button
            type="button"
            onClick={onBackToCitizen}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Warga</span>
          </button>
        </div>

        <div className="max-w-xl space-y-8 my-auto py-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 text-sm font-semibold text-sky-300">
              <Building2 className="w-5 h-5" />
              <span>Dinas Pekerjaan Umum dan Penataan Ruang · Kabupaten Kebumen</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
              Pusat Kendali Verifikasi & Disposisi Aksesibilitas Ruang Publik
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              Kelola laporan hambatan fasilitas publik secara objektif menggunakan skala prioritas
              0–100, pantau progres regu lapangan Tim Reaksi Cepat (TRC), dan publikasikan
              dokumentasi perbaikan secara transparan kepada warga.
            </p>
          </div>

          {/* Priority Assessment Reference */}
          <div className="border-t border-white/15 pt-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                Aspek Penilaian Urutan Prioritas
              </span>
              <span className="font-mono tabular-nums">Skala Penilaian 0 – 100</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { step: '01', label: 'Keselamatan Warga', weight: '35%' },
                { step: '02', label: 'Aksesibilitas Difabel', weight: '30%' },
                { step: '03', label: 'Cakupan Pengguna', weight: '20%' },
                { step: '04', label: 'Kerusakan Fisik', weight: '15%' },
              ].map(item => (
                <div
                  key={item.step}
                  className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                    <span>{item.step}</span>
                    <span className="text-sky-300 font-semibold">{item.weight}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 leading-snug">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-5">
          <span>SUARA RUANG · Sistem Informasi Aksesibilitas Terpadu</span>
          <span className="font-mono tabular-nums">Kabupaten Kebumen</span>
        </div>
      </div>

      {/* Right Login Form Surface (All Devices) */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-5 sm:p-8 lg:p-12 bg-white">
        {/* Mobile/Tablet Top Navigation */}
        <div className="flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={onBackToCitizen}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00355f] hover:underline py-2 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Warga</span>
          </button>
          <span className="text-xs font-mono text-slate-500">Dinas PUPR Kebumen</span>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-6 space-y-7">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#00355f] text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-[#005187] pt-2">
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

            <div className="pt-2 space-y-2.5">
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

              <button
                type="button"
                onClick={handleQuickLogin}
                className="w-full h-11 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Zap className="w-4 h-4 text-[#00355f]" />
                <span>Masuk Cepat Pengawas PUPR</span>
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
