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
  'Kebumen',
  'Gombong',
  'Karanganyar',
  'Pejagoan',
  'Klirong',
  'Sruweng',
  'Prembun',
  'Kutowinangun',
  'Petanahan',
  'Ayah',
  'Rowokele',
  'Sempor',
  'Buayan',
  'Adimulyo',
  'Kuwarasan',
  'Alian',
  'Puring',
  'Ambal',
  'Mirit',
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

export function detectKebumenDistrict(text: string): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  // Check specific non-'Kebumen' districts first so "Kabupaten Kebumen" doesn't overshadow "Kecamatan Gombong"
  for (const dist of KNOWN_KEBUMEN_DISTRICTS) {
    if (dist === 'Kebumen') continue;
    if (
      lower.includes(`kecamatan ${dist.toLowerCase()}`) ||
      lower.includes(`kec. ${dist.toLowerCase()}`) ||
      lower.includes(dist.toLowerCase())
    ) {
      return dist;
    }
  }
  if (lower.includes('kecamatan kebumen') || lower.includes('kec. kebumen') || lower.includes('bumirejo') || lower.includes('panjer') || lower.includes('kutosari')) {
    return 'Kebumen';
  }
  return undefined;
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
 * (Nominatim with Kebumen bounding box priority + Photon fallback).
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
    // 1. Primary OpenStreetMap Nominatim query prioritized around Kabupaten Kebumen
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=id&viewbox=109.33,-7.42,109.86,-7.85&bounded=0&limit=8&accept-language=id&q=${encodeURIComponent(
      biasedQuery
    )}`;

    const res = await fetch(nominatimUrl, {
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

          const detectedDistrict = detectKebumenDistrict(
            `${item.address?.municipality || ''} ${item.address?.suburb || ''} ${item.address?.village || ''} ${displayName}`
          );

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

    // If biased query returned nothing and user typed a broader place name, try exact query without appending 'Kebumen'
    if (remoteResults.length === 0 && !hasKebumenWord) {
      const broadUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=id&viewbox=109.33,-7.42,109.86,-7.85&bounded=0&limit=6&accept-language=id&q=${encodeURIComponent(
        trimmed
      )}`;
      const broadRes = await fetch(broadUrl, { signal, headers: { Accept: 'application/json' } });
      if (broadRes.ok) {
        const broadData = await broadRes.json();
        if (Array.isArray(broadData)) {
          for (const item of broadData) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
            const displayName: string = item.display_name || '';
            const primaryName: string = item.name || displayName.split(',')[0] || trimmed;
            remoteResults.push({
              id: `osm-broad-${item.place_id}`,
              name: primaryName,
              address: displayName,
              district: detectKebumenDistrict(displayName),
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
        biasedQuery
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
              district: detectKebumenDistrict(`${addrParts} ${name}`),
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
    const district = detectKebumenDistrict(
      `${addr.municipality || ''} ${addr.suburb || ''} ${addr.city_district || ''} ${addr.village || ''} ${fullAddress || ''}`
    );
    return { roadOrPlace, fullAddress, district };
  } catch {
    return null;
  }
}
