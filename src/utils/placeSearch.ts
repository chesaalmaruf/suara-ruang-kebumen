export interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  district?: string;
  lat: number;
  lng: number;
  categoryLabel?: string;
  source: 'local' | 'osm';
}

export const KNOWN_KEBUMEN_DISTRICTS = [
  'Adimulyo',
  'Alian',
  'Ambal',
  'Ayah',
  'Bonorowo',
  'Buayan',
  'Buluspesantren',
  'Gombong',
  'Karanganyar',
  'Karanggayam',
  'Karangsambung',
  'Kebumen',
  'Klirong',
  'Kutowinangun',
  'Kuwarasan',
  'Mirit',
  'Padureso',
  'Pejagoan',
  'Petanahan',
  'Poncowarno',
  'Prembun',
  'Puring',
  'Rowokele',
  'Sadang',
  'Sempor',
  'Sruweng',
];

const CURATED_KEBUMEN_PLACES: PlaceSuggestion[] = [
  {
    id: 'kbm-alun-alun',
    name: 'Alun-Alun Pancasila Kebumen',
    address: 'Jl. Merdeka, Bumirejo, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.66875,
    lng: 109.6521,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-pasar-tumenggungan',
    name: 'Pasar Tumenggungan Kebumen',
    address: 'Jl. Pahlawan, Tumenggungan, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.67135,
    lng: 109.6562,
    categoryLabel: 'Fasilitas Umum',
    source: 'local',
  },
  {
    id: 'kbm-stasiun-kebumen',
    name: 'Stasiun Kebumen',
    address: 'Jl. Stasiun, Panjer, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.68152,
    lng: 109.66218,
    categoryLabel: 'Transportasi',
    source: 'local',
  },
  {
    id: 'kbm-rsud-soedirman',
    name: 'RSUD Dr. Soedirman Kebumen',
    address: 'Jl. Lingkar Selatan, Muktisari, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.6789,
    lng: 109.6395,
    categoryLabel: 'Layanan Kesehatan',
    source: 'local',
  },
  {
    id: 'kbm-mpp',
    name: 'Mall Pelayanan Publik (MPP) Kebumen',
    address: 'Jl. Indrakila No. 36, Panjer, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.6697,
    lng: 109.6509,
    categoryLabel: 'Pelayanan Publik',
    source: 'local',
  },
  {
    id: 'kbm-pendopo-bupati',
    name: 'Pendopo Kabumian / Kantor Bupati Kebumen',
    address: 'Jl. Merdeka No. 2, Kutosari, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.66785,
    lng: 109.65215,
    categoryLabel: 'Pemerintahan',
    source: 'local',
  },
  {
    id: 'kbm-dpupr',
    name: 'Kantor Dinas PUPR Kabupaten Kebumen',
    address: 'Jl. HM Sarbini No. 107, Bumirejo, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.6704,
    lng: 109.6491,
    categoryLabel: 'Pemerintahan',
    source: 'local',
  },
  {
    id: 'kbm-terminal-bus',
    name: 'Terminal Bus Tipe A Kebumen',
    address: 'Jl. Lingkar Selatan, Jatimulyo, Kec. Alian / Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.6808,
    lng: 109.6761,
    categoryLabel: 'Transportasi',
    source: 'local',
  },
  {
    id: 'kbm-taman-sarbini',
    name: 'Taman Kota HM Sarbini Kebumen',
    address: 'Jl. HM Sarbini, Bumirejo, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.6725,
    lng: 109.6485,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-masjid-agung',
    name: 'Masjid Agung Kauman Kebumen',
    address: 'Jl. Pahlawan Barat Alun-Alun, Kauman, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.66885,
    lng: 109.65065,
    categoryLabel: 'Tempat Ibadah',
    source: 'local',
  },
  {
    id: 'kbm-rsu-permata-medika',
    name: 'RSU Permata Medika Kebumen',
    address: 'Jl. Indrakila No. 17, Kebumen, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.6709,
    lng: 109.6472,
    categoryLabel: 'Layanan Kesehatan',
    source: 'local',
  },
  {
    id: 'kbm-upb',
    name: 'Universitas Putra Bangsa (UPB) Kebumen',
    address: 'Jl. Ronggowarsito No. 18, Pejagoan, Kabupaten Kebumen',
    district: 'Pejagoan',
    lat: -7.6742,
    lng: 109.6714,
    categoryLabel: 'Pendidikan',
    source: 'local',
  },
  {
    id: 'kbm-iainu',
    name: 'IAINU Kebumen',
    address: 'Jl. Tentara Pelajar No. 55B, Panjer, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.6761,
    lng: 109.6698,
    categoryLabel: 'Pendidikan',
    source: 'local',
  },
  {
    id: 'kbm-puskesmas-kebumen-1',
    name: 'Puskesmas Kebumen I',
    address: 'Jl. Pahlawan No. 146, Kebumen, Kec. Kebumen, Kabupaten Kebumen',
    district: 'Kebumen',
    lat: -7.6665,
    lng: 109.6548,
    categoryLabel: 'Layanan Kesehatan',
    source: 'local',
  },
  {
    id: 'kbm-pku-gombong',
    name: 'RS PKU Muhammadiyah Gombong',
    address: 'Jl. Yos Sudarso No. 461, Sangkalputung, Kec. Gombong, Kabupaten Kebumen',
    district: 'Gombong',
    lat: -7.6062,
    lng: 109.5126,
    categoryLabel: 'Layanan Kesehatan',
    source: 'local',
  },
  {
    id: 'kbm-pasar-wonokriyo',
    name: 'Pasar Wonokriyo Gombong',
    address: 'Jl. Yos Sudarso, Wonokriyo, Kec. Gombong, Kabupaten Kebumen',
    district: 'Gombong',
    lat: -7.6059,
    lng: 109.5142,
    categoryLabel: 'Fasilitas Umum',
    source: 'local',
  },
  {
    id: 'kbm-stasiun-gombong',
    name: 'Stasiun Gombong',
    address: 'Jl. Stasiun Gombong, Wonokriyo, Kec. Gombong, Kabupaten Kebumen',
    district: 'Gombong',
    lat: -7.6095,
    lng: 109.5112,
    categoryLabel: 'Transportasi',
    source: 'local',
  },
  {
    id: 'kbm-alun-alun-gombong',
    name: 'Alun-Alun Manunggal Gombong',
    address: 'Jl. Kartini, Gombong, Kec. Gombong, Kabupaten Kebumen',
    district: 'Gombong',
    lat: -7.6061,
    lng: 109.5082,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-vanderwijck',
    name: 'Benteng Van der Wijck Gombong',
    address: 'Sidayu, Kec. Gombong, Kabupaten Kebumen',
    district: 'Gombong',
    lat: -7.596,
    lng: 109.5173,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-alun-karanganyar',
    name: 'Alun-Alun Karanganyar Kebumen',
    address: 'Jl. Revolusi, Karanganyar, Kec. Karanganyar, Kabupaten Kebumen',
    district: 'Karanganyar',
    lat: -7.6296,
    lng: 109.5728,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-pasar-karanganyar',
    name: 'Pasar Karanganyar Kebumen',
    address: 'Jl. Revolusi, Kec. Karanganyar, Kabupaten Kebumen',
    district: 'Karanganyar',
    lat: -7.6305,
    lng: 109.5742,
    categoryLabel: 'Fasilitas Umum',
    source: 'local',
  },
  {
    id: 'kbm-stasiun-karanganyar',
    name: 'Stasiun Karanganyar Kebumen',
    address: 'Jl. Stasiun, Kec. Karanganyar, Kabupaten Kebumen',
    district: 'Karanganyar',
    lat: -7.6331,
    lng: 109.5746,
    categoryLabel: 'Transportasi',
    source: 'local',
  },
  {
    id: 'kbm-pku-sruweng',
    name: 'RS PKU Muhammadiyah Sruweng',
    address: 'Jl. Raya Sruweng No. 5, Kec. Sruweng, Kabupaten Kebumen',
    district: 'Sruweng',
    lat: -7.6438,
    lng: 109.6059,
    categoryLabel: 'Layanan Kesehatan',
    source: 'local',
  },
  {
    id: 'kbm-pasar-kutowinangun',
    name: 'Pasar Kutowinangun',
    address: 'Jl. Raya Kutowinangun, Kec. Kutowinangun, Kabupaten Kebumen',
    district: 'Kutowinangun',
    lat: -7.7072,
    lng: 109.7495,
    categoryLabel: 'Fasilitas Umum',
    source: 'local',
  },
  {
    id: 'kbm-stasiun-kutowinangun',
    name: 'Stasiun Kutowinangun',
    address: 'Kutowinangun, Kec. Kutowinangun, Kabupaten Kebumen',
    district: 'Kutowinangun',
    lat: -7.7089,
    lng: 109.7501,
    categoryLabel: 'Transportasi',
    source: 'local',
  },
  {
    id: 'kbm-rsud-prembun',
    name: 'RSUD Prembun Kebumen',
    address: 'Jl. Slamet Riyadi No. 53, Kec. Prembun, Kabupaten Kebumen',
    district: 'Prembun',
    lat: -7.7204,
    lng: 109.7985,
    categoryLabel: 'Layanan Kesehatan',
    source: 'local',
  },
  {
    id: 'kbm-pasar-prembun',
    name: 'Pasar Prembun',
    address: 'Jl. Raya Prembun, Kec. Prembun, Kabupaten Kebumen',
    district: 'Prembun',
    lat: -7.7219,
    lng: 109.8035,
    categoryLabel: 'Fasilitas Umum',
    source: 'local',
  },
  {
    id: 'kbm-pasar-petanahan',
    name: 'Pasar Petanahan',
    address: 'Jl. Raya Petanahan, Kec. Petanahan, Kabupaten Kebumen',
    district: 'Petanahan',
    lat: -7.7568,
    lng: 109.5912,
    categoryLabel: 'Fasilitas Umum',
    source: 'local',
  },
  {
    id: 'kbm-pantai-petanahan',
    name: 'Kawasan Pantai Petanahan',
    address: 'Karanggadung, Kec. Petanahan, Kabupaten Kebumen',
    district: 'Petanahan',
    lat: -7.7952,
    lng: 109.5855,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-pantai-menganti',
    name: 'Pantai Menganti Kebumen',
    address: 'Karangduwur, Kec. Ayah, Kabupaten Kebumen',
    district: 'Ayah',
    lat: -7.7702,
    lng: 109.4128,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-goa-jatijajar',
    name: 'Kawasan Wisata Goa Jatijajar',
    address: 'Jatijajar, Kec. Ayah, Kabupaten Kebumen',
    district: 'Ayah',
    lat: -7.6672,
    lng: 109.4271,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-waduk-sempor',
    name: 'Kawasan Waduk Sempor',
    address: 'Sempor, Kec. Sempor, Kabupaten Kebumen',
    district: 'Sempor',
    lat: -7.5592,
    lng: 109.4865,
    categoryLabel: 'Ruang Publik',
    source: 'local',
  },
  {
    id: 'kbm-pasar-klirong',
    name: 'Pasar Dorowati Klirong',
    address: 'Dorowati, Kec. Klirong, Kabupaten Kebumen',
    district: 'Klirong',
    lat: -7.7215,
    lng: 109.6124,
    categoryLabel: 'Fasilitas Umum',
    source: 'local',
  },
  {
    id: 'kbm-puskesmas-pejagoan',
    name: 'Puskesmas Pejagoan',
    address: 'Jl. Raya Sokka, Kec. Pejagoan, Kabupaten Kebumen',
    district: 'Pejagoan',
    lat: -7.6691,
    lng: 109.6368,
    categoryLabel: 'Layanan Kesehatan',
    source: 'local',
  },
];

function stripDistrictPrefix(raw: string): string {
  return raw
    .replace(/^(?:kecamatan|kec\.|kemantren|kapanewon|distrik)\s+/i, '')
    .trim();
}

function findKnownKebumenDistrict(text: string): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  // Check the 25 non-'Kebumen' sub-districts first so "Kabupaten Kebumen" doesn't overshadow them
  for (const dist of KNOWN_KEBUMEN_DISTRICTS) {
    if (dist === 'Kebumen') continue;
    const escaped = dist.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      // Guard 'Karanganyar' against Kabupaten Karanganyar (Surakarta area)
      if (
        dist === 'Karanganyar' &&
        /\bkabupaten\s+karanganyar\b|\bkab\.\s*karanganyar\b/i.test(lower) &&
        !/\bkebumen\b/i.test(lower)
      ) {
        continue;
      }
      return dist;
    }
  }

  if (
    /\b(?:kecamatan|kec\.)\s+kebumen\b/i.test(lower) ||
    /\b(?:bumirejo|panjer|kutosari|tamanwinangun|selang|kebumen)\b/i.test(lower)
  ) {
    if (
      /\b(?:kecamatan|kec\.)\s+kebumen\b/i.test(lower) ||
      /\b(?:bumirejo|panjer|kutosari|tamanwinangun)\b/i.test(lower)
    ) {
      return 'Kebumen';
    }
  }

  return undefined;
}

/**
 * Extracts either one of the 26 Kabupaten Kebumen sub-districts OR any external
 * Kecamatan / Kabupaten / Kota in Indonesia from structured Nominatim fields and/or display address.
 */
export function extractDistrictFromAddress(
  text: string,
  structuredAddr?: Record<string, any>
): string | undefined {
  // 1. Structured Nominatim / geocoder address object
  if (structuredAddr && typeof structuredAddr === 'object') {
    const rawSub: string =
      structuredAddr.city_district ||
      structuredAddr.municipality ||
      structuredAddr.district ||
      structuredAddr.suburb ||
      structuredAddr.town ||
      '';
    const rawRegency: string =
      structuredAddr.county ||
      structuredAddr.city ||
      structuredAddr.regency ||
      structuredAddr.state_district ||
      '';

    const cleanSub = stripDistrictPrefix(String(rawSub || ''));
    const cleanRegencyRaw = String(rawRegency || '').trim();
    const isKebumenRegency =
      /\bkebumen\b/i.test(cleanRegencyRaw) ||
      (!cleanRegencyRaw && /\bkabupaten\s+kebumen\b|\bkab\.\s*kebumen\b/i.test(text || ''));

    if (isKebumenRegency) {
      const matchedInSub = findKnownKebumenDistrict(cleanSub);
      if (matchedInSub) return matchedInSub;

      const matchedInFull = findKnownKebumenDistrict(
        `${cleanSub} ${structuredAddr.village || ''} ${text || ''}`
      );
      if (matchedInFull) return matchedInFull;

      if (cleanSub && !/^(kebumen|jawa|indonesia)$/i.test(cleanSub)) {
        return cleanSub;
      }
      return 'Kebumen';
    }

    if (cleanRegencyRaw) {
      const isKota = /^kota\s+/i.test(cleanRegencyRaw);
      const regBase = cleanRegencyRaw
        .replace(/^(?:kabupaten|kab\.|kota)\s+/i, '')
        .replace(/\s+regency$/i, '')
        .trim();
      const regFormatted = isKota ? `Kota ${regBase}` : regBase;

      if (cleanSub && !/^(jawa|indonesia)$/i.test(cleanSub)) {
        if (cleanSub.toLowerCase() !== regBase.toLowerCase()) {
          return `${cleanSub} (${regFormatted})`;
        }
        return isKota ? `Kota ${regBase}` : `${cleanSub} (Kab. ${regBase})`;
      }
      return isKota ? `Kota ${regBase}` : `Kab. ${regBase}`;
    }
  }

  if (!text || !text.trim()) return undefined;
  const trimmed = text.trim();

  // 2. Check explicit non-Kebumen regency/city in plain text BEFORE Kebumen fallback
  const regencyMatch = trimmed.match(
    /\b(kabupaten|kab\.|kota)\s+([a-zA-Z\s'-]+?)(?=,|\.|;|\(|$|\s+jawa|\s+provinsi|\s+\d{5})/i
  );
  const explicitRegencyPrefix = regencyMatch ? regencyMatch[1].toLowerCase() : '';
  const explicitRegencyName = regencyMatch ? regencyMatch[2].trim() : '';
  const hasExplicitExternalRegency =
    Boolean(explicitRegencyName) && !/\bkebumen\b/i.test(explicitRegencyName);

  // 3. Explicit "Kecamatan X" / "Kec. X" / "Kemantren X" / "Kapanewon X"
  const kecMatch = trimmed.match(
    /\b(?:kecamatan|kec\.|kemantren|kapanewon|distrik)\s+([a-zA-Z\s'-]+?)(?=,|\.|;|\(|\/|$|\s+kabupaten|\s+kab\.|\s+kota)/i
  );
  if (kecMatch && kecMatch[1]) {
    const extractedKec = stripDistrictPrefix(kecMatch[1]);
    if (!hasExplicitExternalRegency) {
      const knownKbm = KNOWN_KEBUMEN_DISTRICTS.find(
        d => d.toLowerCase() === extractedKec.toLowerCase()
      );
      if (knownKbm) return knownKbm;
    }
    if (hasExplicitExternalRegency) {
      const isKota = explicitRegencyPrefix.startsWith('kota');
      const regLabel = isKota ? `Kota ${explicitRegencyName}` : explicitRegencyName;
      if (extractedKec.toLowerCase() !== explicitRegencyName.toLowerCase()) {
        return `${extractedKec} (${regLabel})`;
      }
      return isKota ? `Kota ${explicitRegencyName}` : `${extractedKec} (Kab. ${explicitRegencyName})`;
    }
    if (extractedKec) return extractedKec;
  }

  // 4. Comma-separated Nominatim display_name parsing (e.g. "..., Setrojenar, Buluspesantren, Kebumen, Jawa Tengah, Jawa, 54391, Indonesia")
  const rawSegments = trimmed
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (rawSegments.length >= 3) {
    const segs = [...rawSegments];
    let strippedGeoTail = false;

    while (segs.length > 0) {
      const tail = segs[segs.length - 1];
      if (
        /^indonesia$/i.test(tail) ||
        /^\d{5}$/.test(tail) ||
        /^(?:jawa|java|sumatera|sumatra|kalimantan|sulawesi|bali|papua|maluku|nusa\s+tenggara.*)$/i.test(
          tail
        ) ||
        /^(?:provinsi\s+.+|jawa\s+(?:tengah|barat|timur)|daerah\s+istimewa\s+yogyakarta|di\s+yogyakarta|dki\s+jakarta|daerah\s+khusus\s+ibukota\s+jakarta|banten|lampung|riau|jambi|bengkulu|aceh|(?:sumatera|kalimantan|sulawesi|maluku|nusa\s+tenggara|papua)\s+.+)$/i.test(
          tail
        )
      ) {
        if (!/^\d{5}$/.test(tail)) strippedGeoTail = true;
        segs.pop();
      } else {
        break;
      }
    }

    if (strippedGeoTail && segs.length >= 1) {
      const regSeg = segs[segs.length - 1];
      const subSeg = segs.length >= 2 ? stripDistrictPrefix(segs[segs.length - 2]) : '';
      const isRoadLike = /^(?:jl\.|jalan\s|gg\.|gang\s|rt\s|rw\s|no\.|\d)/i.test(subSeg);

      if (/\bkebumen\b/i.test(regSeg)) {
        const matchedSub = findKnownKebumenDistrict(subSeg);
        if (matchedSub) return matchedSub;
        const matchedAny = findKnownKebumenDistrict(segs.join(', '));
        if (matchedAny) return matchedAny;
        if (subSeg && !isRoadLike && !/\bkebumen\b/i.test(subSeg)) {
          return subSeg;
        }
        return 'Kebumen';
      } else {
        const isKota = /^kota\s+/i.test(regSeg);
        const regBase = regSeg
          .replace(/^(?:kabupaten|kab\.|kota)\s+/i, '')
          .replace(/\s+regency$/i, '')
          .trim();
        const regFormatted = isKota ? `Kota ${regBase}` : regBase;

        if (subSeg && !isRoadLike) {
          if (subSeg.toLowerCase() !== regBase.toLowerCase()) {
            return `${subSeg} (${regFormatted})`;
          }
          return isKota ? `Kota ${regBase}` : `${subSeg} (Kab. ${regBase})`;
        }
        return isKota ? `Kota ${regBase}` : `Kab. ${regBase}`;
      }
    }
  }

  // 5. Check known Kebumen sub-districts if no external regency was stated
  if (!hasExplicitExternalRegency) {
    const known = findKnownKebumenDistrict(trimmed);
    if (known) return known;
  }

  // 6. Explicit external Kabupaten / Kota fallback
  if (hasExplicitExternalRegency) {
    const isKota = explicitRegencyPrefix.startsWith('kota');
    return isKota ? `Kota ${explicitRegencyName}` : `Kab. ${explicitRegencyName}`;
  }

  return undefined;
}

export function detectKebumenDistrict(
  text: string,
  structuredAddr?: Record<string, any>
): string | undefined {
  return extractDistrictFromAddress(text, structuredAddr);
}

/**
 * Formats a district / area name cleanly without redundant "Kec. Kab." prefixes.
 */
export function formatDistrictLabel(
  district?: string,
  style: 'short' | 'full' = 'short'
): string {
  const clean = (district || '').trim();
  if (!clean) return style === 'full' ? 'Kecamatan Kebumen' : 'Kec. Kebumen';
  if (/^(?:kec\.|kecamatan|kab\.|kabupaten|kota|wilayah|luar)\b/i.test(clean) || clean === 'Lainnya') {
    return clean;
  }
  return style === 'full' ? `Kecamatan ${clean}` : `Kec. ${clean}`;
}

/**
 * Automatically recovers & normalizes `report.district` when a report's `address` or `placeName`
 * already read a real Kecamatan / Kabupaten (including outside Kebumen), but `district` was left
 * at default `'Kebumen'`, `'Lainnya'`, or blank.
 */
export function resolveReportDistrict<
  T extends {
    district?: string;
    address?: string;
    placeName?: string;
    coordinates?: { lat: number; lng: number };
  }
>(report: T): T {
  if (!report) return report;
  const rawDistrict = stripDistrictPrefix((report.district || '').trim());
  const detectedFromAddress =
    extractDistrictFromAddress(report.address || '') ||
    extractDistrictFromAddress(report.placeName || '');

  const isDefaultOrUnset =
    !rawDistrict ||
    rawDistrict.toLowerCase() === 'kebumen' ||
    rawDistrict.toLowerCase() === 'lainnya';

  let resolved = rawDistrict || 'Kebumen';

  if (detectedFromAddress && isDefaultOrUnset) {
    resolved = detectedFromAddress;
  } else if (
    isDefaultOrUnset &&
    report.coordinates &&
    (report.coordinates.lat < -7.88 ||
      report.coordinates.lat > -7.38 ||
      report.coordinates.lng < 109.32 ||
      report.coordinates.lng > 109.88)
  ) {
    // Coordinates are clearly outside Kabupaten Kebumen's geographic bounds
    if (detectedFromAddress) {
      resolved = detectedFromAddress;
    } else if (report.placeName?.trim()) {
      resolved = `Luar Kebumen (${report.placeName.trim().slice(0, 24)})`;
    } else {
      resolved = 'Luar Kebumen';
    }
  }

  if (resolved === report.district) {
    return report;
  }
  return {
    ...report,
    district: resolved,
  };
}

export function searchLocalKebumenPlaces(query: string): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return CURATED_KEBUMEN_PLACES.slice(0, 6);

  const tokens = q.split(/\s+/).filter(Boolean);
  return CURATED_KEBUMEN_PLACES.filter(place => {
    const haystack = `${place.name} ${place.address} ${place.district || ''} ${place.categoryLabel || ''}`.toLowerCase();
    return tokens.every(t => haystack.includes(t));
  }).slice(0, 6);
}

/**
 * Searches places combining instant local Kebumen landmarks + live OpenStreetMap geocoding
 * (Nominatim with Kebumen viewbox priority while supporting all Indonesia locations + Photon fallback).
 */
export async function searchPlacesHybrid(
  query: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  const localMatches = searchLocalKebumenPlaces(trimmed);

  if (trimmed.length < 2) {
    return localMatches;
  }

  const hasKebumenWord = trimmed.toLowerCase().includes('kebumen');
  const biasedQuery = hasKebumenWord ? trimmed : `${trimmed} Kebumen`;

  const remoteResults: PlaceSuggestion[] = [];

  try {
    // 1. Primary OpenStreetMap Nominatim query using exact user query with Kebumen viewbox bias (bounded=0)
    // so both Kebumen sub-districts AND places outside Kebumen resolve accurately with full addressdetails.
    const primaryUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=id&viewbox=109.33,-7.42,109.86,-7.85&bounded=0&limit=8&accept-language=id&q=${encodeURIComponent(
      trimmed
    )}`;

    const res = await fetch(primaryUrl, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

          const displayName: string = item.display_name || '';
          const primaryName: string =
            item.name ||
            item.address?.amenity ||
            item.address?.building ||
            item.address?.shop ||
            item.address?.road ||
            item.address?.village ||
            displayName.split(',')[0] ||
            trimmed;

          const detectedDistrict = extractDistrictFromAddress(displayName, item.address);

          remoteResults.push({
            id: `osm-${item.place_id}`,
            name: primaryName,
            address: displayName,
            district: detectedDistrict,
            lat: Number(lat.toFixed(5)),
            lng: Number(lng.toFixed(5)),
            categoryLabel: item.type
              ? item.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
              : 'Peta OSM',
            source: 'osm',
          });
        }
      }
    }

    // If exact query returned nothing, try appending 'Kebumen' for local street/village shorthand
    if (remoteResults.length === 0 && !hasKebumenWord) {
      const biasedUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=id&viewbox=109.33,-7.42,109.86,-7.85&bounded=0&limit=6&accept-language=id&q=${encodeURIComponent(
        biasedQuery
      )}`;
      const biasedRes = await fetch(biasedUrl, { signal, headers: { Accept: 'application/json' } });
      if (biasedRes.ok) {
        const biasedData = await biasedRes.json();
        if (Array.isArray(biasedData)) {
          for (const item of biasedData) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
            const displayName: string = item.display_name || '';
            const primaryName: string = item.name || displayName.split(',')[0] || trimmed;
            remoteResults.push({
              id: `osm-kbm-${item.place_id}`,
              name: primaryName,
              address: displayName,
              district: extractDistrictFromAddress(displayName, item.address),
              lat: Number(lat.toFixed(5)),
              lng: Number(lng.toFixed(5)),
              categoryLabel: 'Lokasi Peta',
              source: 'osm',
            });
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    // 2. Fallback to Photon Komoot OpenStreetMap geocoder if Nominatim fails
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        trimmed
      )}&lat=-7.6748&lon=109.6575&limit=6`;
      const pRes = await fetch(photonUrl, { signal });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData?.features)) {
          for (const feat of pData.features) {
            const coords = feat?.geometry?.coordinates;
            const props = feat?.properties || {};
            if (!Array.isArray(coords) || coords.length < 2) continue;
            const lng = Number(Number(coords[0]).toFixed(5));
            const lat = Number(Number(coords[1]).toFixed(5));
            const name = props.name || props.street || trimmed;
            const addrParts = [props.street, props.district, props.city, props.county, props.state]
              .filter(Boolean)
              .join(', ');
            remoteResults.push({
              id: `photon-${props.osm_id || `${lat}-${lng}`}`,
              name,
              address: addrParts || name,
              district: extractDistrictFromAddress(`${addrParts}, ${name}`, {
                district: props.district,
                city: props.city,
                county: props.county,
              }),
              lat,
              lng,
              categoryLabel: 'Peta OSM',
              source: 'osm',
            });
          }
        }
      }
    } catch (fallbackErr: any) {
      if (fallbackErr?.name === 'AbortError') throw fallbackErr;
    }
  }

  // Merge local curated + remote OSM results without near-identical coordinate/name duplicates
  const merged: PlaceSuggestion[] = [...localMatches];
  for (const rem of remoteResults) {
    const isDuplicate = merged.some(existing => {
      const sameName = existing.name.toLowerCase() === rem.name.toLowerCase();
      const closeDist =
        Math.abs(existing.lat - rem.lat) < 0.0012 && Math.abs(existing.lng - rem.lng) < 0.0012;
      return sameName && closeDist;
    });
    if (!isDuplicate) {
      merged.push(rem);
    }
  }

  return merged.slice(0, 8);
}

/**
 * Reverse geocodes manual map pin coordinates into human-readable address & district.
 */
export async function reverseGeocodePoint(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<{ roadOrPlace?: string; fullAddress?: string; district?: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=id`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};
    const roadOrPlace =
      data?.name ||
      addr.amenity ||
      addr.building ||
      addr.road ||
      addr.neighbourhood ||
      addr.village ||
      undefined;
    const fullAddress: string | undefined = data?.display_name || undefined;
    const district = extractDistrictFromAddress(fullAddress || '', addr);
    return { roadOrPlace, fullAddress, district };
  } catch {
    return null;
  }
}
