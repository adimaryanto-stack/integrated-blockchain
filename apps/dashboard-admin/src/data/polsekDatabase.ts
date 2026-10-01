export interface PolsekData {
  id: string;
  nama: string;
  polres: string;
  polda: string;
  provinsi: string;
  kabupatenKota: string;
  kecamatan: string;
  alamat: string;
  telepon: string;
  hotline: string;
  latitude: number;
  longitude: number;
  statusSiaga: string;
}

export const INDONESIA_POLSEK_DIRECTORY: PolsekData[] = [
  // ── PROVINSI LAMPUNG ──
  {
    id: "polsek-lpg-001",
    nama: "Polsek Kedaton",
    polres: "Polresta Bandar Lampung",
    polda: "Polda Lampung",
    provinsi: "Lampung",
    kabupatenKota: "Kota Bandar Lampung",
    kecamatan: "Kedaton",
    alamat: "Jl. Teuku Umar No. 12, Kedaton, Kota Bandar Lampung, Lampung 35141",
    telepon: "(0721) 701234",
    hotline: "110",
    latitude: -5.3831,
    longitude: 105.2580,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-lpg-002",
    nama: "Polsek Tanjung Karang Barat",
    polres: "Polresta Bandar Lampung",
    polda: "Polda Lampung",
    provinsi: "Lampung",
    kabupatenKota: "Kota Bandar Lampung",
    kecamatan: "Tanjung Karang Barat",
    alamat: "Jl. Panglima Polim No. 18, Segala Mider, Kota Bandar Lampung, Lampung 35152",
    telepon: "(0721) 252874",
    hotline: "110",
    latitude: -5.3955,
    longitude: 105.2450,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-lpg-003",
    nama: "Polsek Teluk Betung Selatan",
    polres: "Polresta Bandar Lampung",
    polda: "Polda Lampung",
    provinsi: "Lampung",
    kabupatenKota: "Kota Bandar Lampung",
    kecamatan: "Teluk Betung Selatan",
    alamat: "Jl. Ikan Hiu No. 3, Pesawahan, Teluk Betung Selatan, Kota Bandar Lampung 35221",
    telepon: "(0721) 481230",
    hotline: "110",
    latitude: -5.4480,
    longitude: 105.2630,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-lpg-004",
    nama: "Polsek Gedong Tataan",
    polres: "Polres Pesawaran",
    polda: "Polda Lampung",
    provinsi: "Lampung",
    kabupatenKota: "Kabupaten Pesawaran",
    kecamatan: "Gedong Tataan",
    alamat: "Jl. Raya Gedong Tataan KM 21, Sukaraja, Gedong Tataan, Kab. Pesawaran, Lampung 35366",
    telepon: "(0721) 8011110",
    hotline: "110",
    latitude: -5.3670,
    longitude: 105.1050,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-lpg-005",
    nama: "Polsek Natar",
    polres: "Polres Lampung Selatan",
    polda: "Polda Lampung",
    provinsi: "Lampung",
    kabupatenKota: "Kabupaten Lampung Selatan",
    kecamatan: "Natar",
    alamat: "Jl. Raya Natar No. 88, Merak Batin, Kec. Natar, Kab. Lampung Selatan 35362",
    telepon: "(0721) 91110",
    hotline: "110",
    latitude: -5.3210,
    longitude: 105.2010,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── DKI JAKARTA ──
  {
    id: "polsek-jkt-001",
    nama: "Polsek Metro Gambir",
    polres: "Polres Metro Jakarta Pusat",
    polda: "Polda Metro Jaya",
    provinsi: "DKI Jakarta",
    kabupatenKota: "Jakarta Pusat",
    kecamatan: "Gambir",
    alamat: "Jl. Cideng Barat No. 12, Gambir, Jakarta Pusat 10150",
    telepon: "(021) 3843516",
    hotline: "110",
    latitude: -6.1730,
    longitude: 106.8120,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-jkt-002",
    nama: "Polsek Metro Menteng",
    polres: "Polres Metro Jakarta Pusat",
    polda: "Polda Metro Jaya",
    provinsi: "DKI Jakarta",
    kabupatenKota: "Jakarta Pusat",
    kecamatan: "Menteng",
    alamat: "Jl. Pegangsaan Barat No. 1, Menteng, Jakarta Pusat 10310",
    telepon: "(021) 31924633",
    hotline: "110",
    latitude: -6.1980,
    longitude: 106.8450,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-jkt-003",
    nama: "Polsek Metro Kebayoran Baru",
    polres: "Polres Metro Jakarta Selatan",
    polda: "Polda Metro Jaya",
    provinsi: "DKI Jakarta",
    kabupatenKota: "Jakarta Selatan",
    kecamatan: "Kebayoran Baru",
    alamat: "Jl. Kyai Maja No. 33, Kebayoran Baru, Jakarta Selatan 12130",
    telepon: "(021) 7208888",
    hotline: "110",
    latitude: -6.2415,
    longitude: 106.7940,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-jkt-004",
    nama: "Polsek Metro Setiabudi",
    polres: "Polres Metro Jakarta Selatan",
    polda: "Polda Metro Jaya",
    provinsi: "DKI Jakarta",
    kabupatenKota: "Jakarta Selatan",
    kecamatan: "Setiabudi",
    alamat: "Jl. Karbela Selatan No. 1, Karet Kuningan, Setiabudi, Jakarta Selatan 12940",
    telepon: "(021) 5253683",
    hotline: "110",
    latitude: -6.2160,
    longitude: 106.8280,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── JAWA BARAT ──
  {
    id: "polsek-jbr-001",
    nama: "Polsek Coblong",
    polres: "Polrestabes Bandung",
    polda: "Polda Jawa Barat",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kota Bandung",
    kecamatan: "Coblong",
    alamat: "Jl. Cisitu Lama No. 2, Dago, Kec. Coblong, Kota Bandung, Jawa Barat 40135",
    telepon: "(022) 2503254",
    hotline: "110",
    latitude: -6.8830,
    longitude: 107.6150,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-jbr-002",
    nama: "Polsek Sumur Bandung",
    polres: "Polrestabes Bandung",
    polda: "Polda Jawa Barat",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kota Bandung",
    kecamatan: "Sumur Bandung",
    alamat: "Jl. Babakan Ciamis No. 8, Sumur Bandung, Kota Bandung, Jawa Barat 40117",
    telepon: "(022) 4203657",
    hotline: "110",
    latitude: -6.9140,
    longitude: 107.6080,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-jbr-003",
    nama: "Polsek Bogor Tengah",
    polres: "Polresta Bogor Kota",
    polda: "Polda Jawa Barat",
    provinsi: "Jawa Barat",
    kabupatenKota: "Kota Bogor",
    kecamatan: "Bogor Tengah",
    alamat: "Jl. Kapten Muslihat No. 10, Paledang, Bogor Tengah, Kota Bogor 16122",
    telepon: "(0251) 8322054",
    hotline: "110",
    latitude: -6.5950,
    longitude: 106.7910,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── JAWA TENGAH & DIY ──
  {
    id: "polsek-jtg-001",
    nama: "Polsek Semarang Tengah",
    polres: "Polrestabes Semarang",
    polda: "Polda Jawa Tengah",
    provinsi: "Jawa Tengah",
    kabupatenKota: "Kota Semarang",
    kecamatan: "Semarang Tengah",
    alamat: "Jl. Kauman No. 28, Bangunharjo, Semarang Tengah, Kota Semarang 50139",
    telepon: "(024) 3543110",
    hotline: "110",
    latitude: -6.9740,
    longitude: 110.4220,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-diy-001",
    nama: "Polsek Gondomanan",
    polres: "Polresta Yogyakarta",
    polda: "Polda D.I. Yogyakarta",
    provinsi: "D.I. Yogyakarta",
    kabupatenKota: "Kota Yogyakarta",
    kecamatan: "Gondomanan",
    alamat: "Jl. Ibu Ruswo No. 25, Prawirodirjan, Gondomanan, Kota Yogyakarta 55121",
    telepon: "(0274) 374020",
    hotline: "110",
    latitude: -7.8010,
    longitude: 110.3680,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── JAWA TIMUR ──
  {
    id: "polsek-jtm-001",
    nama: "Polsek Genteng",
    polres: "Polrestabes Surabaya",
    polda: "Polda Jawa Timur",
    provinsi: "Jawa Timur",
    kabupatenKota: "Kota Surabaya",
    kecamatan: "Genteng",
    alamat: "Jl. Ambengan No. 55, Genteng, Kota Surabaya, Jawa Timur 60272",
    telepon: "(031) 5345110",
    hotline: "110",
    latitude: -7.2600,
    longitude: 112.7520,
    statusSiaga: "Siaga 24 Jam"
  },
  {
    id: "polsek-jtm-002",
    nama: "Polsek Tegalsari",
    polres: "Polrestabes Surabaya",
    polda: "Polda Jawa Timur",
    provinsi: "Jawa Timur",
    kabupatenKota: "Kota Surabaya",
    kecamatan: "Tegalsari",
    alamat: "Jl. Basuki Rahmat No. 34, Tegalsari, Kota Surabaya, Jawa Timur 60262",
    telepon: "(031) 5671110",
    hotline: "110",
    latitude: -7.2670,
    longitude: 112.7410,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── SUMATERA UTARA ──
  {
    id: "polsek-su-001",
    nama: "Polsek Medan Baru",
    polres: "Polrestabes Medan",
    polda: "Polda Sumatera Utara",
    provinsi: "Sumatera Utara",
    kabupatenKota: "Kota Medan",
    kecamatan: "Medan Baru",
    alamat: "Jl. Kol. Sugiono No. 1, Medan Baru, Kota Medan, Sumatera Utara 20152",
    telepon: "(061) 4523110",
    hotline: "110",
    latitude: 3.5850,
    longitude: 98.6650,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── SUMATERA SELATAN ──
  {
    id: "polsek-ss-001",
    nama: "Polsek Ilir Timur I",
    polres: "Polrestabes Palembang",
    polda: "Polda Sumatera Selatan",
    provinsi: "Sumatera Selatan",
    kabupatenKota: "Kota Palembang",
    kecamatan: "Ilir Timur I",
    alamat: "Jl. Jenderal Sudirman KM 3.5, Palembang, Sumatera Selatan 30126",
    telepon: "(0711) 351110",
    hotline: "110",
    latitude: -2.9720,
    longitude: 104.7550,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── BALI ──
  {
    id: "polsek-bli-001",
    nama: "Polsek Denpasar Selatan",
    polres: "Polresta Denpasar",
    polda: "Polda Bali",
    provinsi: "Bali",
    kabupatenKota: "Kota Denpasar",
    kecamatan: "Denpasar Selatan",
    alamat: "Jl. By Pass Ngurah Rai No. 89, Sanur Kauh, Denpasar Selatan, Bali 80227",
    telepon: "(0361) 288110",
    hotline: "110",
    latitude: -8.6910,
    longitude: 115.2460,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── SULAWESI SELATAN ──
  {
    id: "polsek-sul-001",
    nama: "Polsek Ujung Pandang",
    polres: "Polrestabes Makassar",
    polda: "Polda Sulawesi Selatan",
    provinsi: "Sulawesi Selatan",
    kabupatenKota: "Kota Makassar",
    kecamatan: "Ujung Pandang",
    alamat: "Jl. Sultan Hasanuddin No. 3, Sawerigading, Ujung Pandang, Makassar 90111",
    telepon: "(0411) 3621110",
    hotline: "110",
    latitude: -5.1380,
    longitude: 119.4100,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── KALIMANTAN TIMUR (IKN & BALIKPAPAN) ──
  {
    id: "polsek-klt-001",
    nama: "Polsek Sepaku (Kawasan Inti IKN)",
    polres: "Polres Penajam Paser Utara",
    polda: "Polda Kalimantan Timur",
    provinsi: "Kalimantan Timur",
    kabupatenKota: "Kabupaten Penajam Paser Utara",
    kecamatan: "Sepaku",
    alamat: "Jl. Negara KM 38, Bukit Raya, Sepaku, Kab. Penajam Paser Utara (Kawasan IKN) 76148",
    telepon: "(0542) 721110",
    hotline: "110",
    latitude: -0.9700,
    longitude: 116.7100,
    statusSiaga: "Siaga 24 Jam - Satgas IKN"
  },
  {
    id: "polsek-klt-002",
    nama: "Polsek Balikpapan Selatan",
    polres: "Polresta Balikpapan",
    polda: "Polda Kalimantan Timur",
    provinsi: "Kalimantan Timur",
    kabupatenKota: "Kota Balikpapan",
    kecamatan: "Balikpapan Selatan",
    alamat: "Jl. Sepinggan Baru No. 12, Sepinggan, Balikpapan Selatan 76115",
    telepon: "(0542) 761110",
    hotline: "110",
    latitude: -1.2480,
    longitude: 116.8920,
    statusSiaga: "Siaga 24 Jam"
  },

  // ── PAPUA ──
  {
    id: "polsek-pap-001",
    nama: "Polsek Jayapura Utara",
    polres: "Polresta Jayapura Kota",
    polda: "Polda Papua",
    provinsi: "Papua",
    kabupatenKota: "Kota Jayapura",
    kecamatan: "Jayapura Utara",
    alamat: "Jl. Percetakan Negara No. 10, Gurabesi, Jayapura Utara, Kota Jayapura 99111",
    telepon: "(0967) 531110",
    hotline: "110",
    latitude: -2.5330,
    longitude: 140.7180,
    statusSiaga: "Siaga 24 Jam"
  }
];

// Haversine formula to compute great-circle distance between two coordinates in kilometers
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Find nearest Polsek given reporter latitude and longitude
export function findNearestPolsek(
  lat: number,
  lon: number,
  radiusKm = 50,
  limit = 5
) {
  const scored = INDONESIA_POLSEK_DIRECTORY.map((polsek) => {
    const jarakKm = calculateHaversineDistance(lat, lon, polsek.latitude, polsek.longitude);
    return {
      ...polsek,
      jarakKm,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${polsek.latitude},${polsek.longitude}`
    };
  });

  scored.sort((a, b) => a.jarakKm - b.jarakKm);

  // Return items within radius or at least the closest ones if none are within radius
  const filtered = scored.filter((p) => p.jarakKm <= radiusKm);
  return (filtered.length > 0 ? filtered : scored).slice(0, limit);
}
