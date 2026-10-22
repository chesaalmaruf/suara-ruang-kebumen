import React from 'react';
import { SAW_WEIGHTS } from '../utils/sawCalculator';

interface SawExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SawExplainerModal: React.FC<SawExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl border border-[#eaedff] space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#eaedff]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#00355f] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">functions</span>
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold text-[#131b2e] leading-tight">
                Metode Simple Additive Weighting (SAW)
              </h3>
              <p className="text-[11px] text-[#42474f]">
                Algoritma Pemeringkatan Prioritas Penanganan Trotoar Kebumen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Dialog"
            className="w-9 h-9 rounded-full bg-[#f2f3ff] hover:bg-[#dae2fd] text-[#131b2e] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Core Concept */}
        <div className="space-y-2 text-[12px] text-[#42474f] leading-relaxed">
          <p>
            Sistem <strong>SUARA RUANG</strong> menggunakan metode <em>Simple Additive Weighting</em> (penjumlahan terbobot) untuk menentukan ranking perbaikan fasilitas publik secara objektif dan transparan tanpa subjektivitas manual.
          </p>
        </div>

        {/* 4 Criteria Table */}
        <div className="space-y-2">
          <h4 className="text-[13px] font-bold text-[#131b2e] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00355f] text-[18px]">table_chart</span>
            Kriteria Penilaian & Bobot Usulan
          </h4>
          <div className="overflow-hidden rounded-xl border border-[#eaedff]">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-[#f2f3ff] text-[#00355f] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Kode</th>
                  <th className="p-2.5">Kriteria Penilaian</th>
                  <th className="p-2.5 text-center">Bobot (wj)</th>
                  <th className="p-2.5 text-center">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaedff]">
                <tr className="hover:bg-[#faf8ff]">
                  <td className="p-2.5 font-bold text-[#ba1a1a]">C1</td>
                  <td className="p-2.5">Tingkat bahaya terhadap keselamatan</td>
                  <td className="p-2.5 text-center font-mono font-bold">35% (0.35)</td>
                  <td className="p-2.5 text-center text-[#005713] font-bold">Benefit</td>
                </tr>
                <tr className="hover:bg-[#faf8ff]">
                  <td className="p-2.5 font-bold text-[#006496]">C2</td>
                  <td className="p-2.5">Dampak terhadap aksesibilitas difabel</td>
                  <td className="p-2.5 text-center font-mono font-bold">30% (0.30)</td>
                  <td className="p-2.5 text-center text-[#005713] font-bold">Benefit</td>
                </tr>
                <tr className="hover:bg-[#faf8ff]">
                  <td className="p-2.5 font-bold text-[#00355f]">C3</td>
                  <td className="p-2.5">Jumlah pengguna / fasilitas publik terdampak</td>
                  <td className="p-2.5 text-center font-mono font-bold">20% (0.20)</td>
                  <td className="p-2.5 text-center text-[#005713] font-bold">Benefit</td>
                </tr>
                <tr className="hover:bg-[#faf8ff]">
                  <td className="p-2.5 font-bold text-[#727780]">C4</td>
                  <td className="p-2.5">Tingkat kerusakan / keparahan fisik</td>
                  <td className="p-2.5 text-center font-mono font-bold">15% (0.15)</td>
                  <td className="p-2.5 text-center text-[#005713] font-bold">Benefit</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulas */}
        <div className="bg-[#eaedff] p-3.5 rounded-2xl space-y-2 border border-[#cce5ff]">
          <h5 className="text-[12px] font-bold text-[#00355f]">
            1. Normalisasi Matriks Keputusan:
          </h5>
          <div className="bg-white p-2.5 rounded-xl font-mono text-[12px] text-center text-[#00355f] font-bold shadow-xs">
            R[i, j] = X[i, j] / max(X[j])
          </div>

          <h5 className="text-[12px] font-bold text-[#00355f] pt-1">
            2. Perhitungan Skor Akhir Prioritas:
          </h5>
          <div className="bg-white p-2.5 rounded-xl font-mono text-[12px] text-center text-[#00355f] font-bold shadow-xs">
            V[i] = ∑ (w[j] × R[i, j])
          </div>
          <p className="text-[10px] text-[#42474f] text-center">
            Tiket dengan skor V[i] tertinggi otomatis menempati antrean teratas SPK Dinas PUPR.
          </p>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white font-bold text-xs transition-colors shadow-sm"
          >
            Mengerti & Tutup Penjelasan
          </button>
        </div>
      </div>
    </div>
  );
};
