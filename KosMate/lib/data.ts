export type Kost = {
  slug: string;
  name: string;
  location: string;
  area: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  tags: string[];
  facilities: string[];
  description: string;
  verified: boolean;
  ownerId?: string;
  active?: boolean;
};

export const kosts: Kost[] = [
  {
    slug: "kost-putri-melati",
    name: "Kost Putri Melati",
    location: "Jl. Tamansari No.12, Bandung",
    area: "Dekat Unpas",
    price: 850000,
    rating: 4.8,
    reviews: 120,
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85",
    tags: ["Putri", "Dekat Unpas"],
    facilities: ["Kamar mandi dalam", "WiFi", "AC", "Dapur bersama", "Lemari", "Meja belajar", "Kasur + spreI", "Parkir motor"],
    description: "Kost khusus putri dengan lingkungan yang aman, bersih, dan nyaman. Lokasi strategis dekat kampus dan akses transportasi mudah.",
    verified: true,
  },
  {
    slug: "kost-senja-residence",
    name: "Kost Senja Residence",
    location: "Jl. Ciumbuleuit No. 8, Bandung",
    area: "Dekat ITB",
    price: 1200000,
    rating: 4.6,
    reviews: 98,
    image: "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=85",
    tags: ["Campur", "Dekat ITB"],
    facilities: ["WiFi", "AC", "Parkir", "CCTV", "Dapur bersama"],
    description: "Hunian nyaman dengan suasana tenang dan akses mudah ke kampus, pusat kuliner, dan transportasi umum.",
    verified: true,
  },
  {
    slug: "kost-putra-nyaman",
    name: "Kost Putra Nyaman",
    location: "Jl. Dipatiukur No. 24, Bandung",
    area: "Dekat Telkom",
    price: 900000,
    rating: 4.7,
    reviews: 76,
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
    tags: ["Putra", "Dekat Telkom"],
    facilities: ["Kamar mandi dalam", "WiFi", "Dapur", "Lemari", "Parkir motor"],
    description: "Kamar bersih dan lapang di lingkungan yang nyaman. Cocok untuk mahasiswa maupun pekerja muda.",
    verified: true,
  },
  {
    slug: "kost-green-house",
    name: "Kost Green House",
    location: "Jl. Setiabudi No. 51, Bandung",
    area: "Dekat UPI",
    price: 950000,
    rating: 4.5,
    reviews: 64,
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    tags: ["Campur", "Dekat UPI"],
    facilities: ["WiFi", "AC", "Dapur bersama", "Laundry", "CCTV"],
    description: "Kost modern dengan banyak ruang hijau, fasilitas lengkap, dan suasana rumah yang hangat.",
    verified: true,
  },
];

export const formatRupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

export type Service = {
  name: string;
  description: string;
  category: string;
  icon: "water" | "basket" | "food" | "cleaning" | "repair" | "package" | "moving" | "home" | "tech" | "luggage" | "chat";
  price: string;
  color: string;
  provider: string;
  rating: number;
};

export const services: Service[] = [
  { name: "Isi Ulang Galon", description: "Air galon ke kamar kos dengan cepat dan praktis.", category: "Galon", icon: "water", price: "Mulai Rp8.000", color: "blue", provider: "Depot Aqua Sehat", rating: 4.8 },
  { name: "Titip Belanja", description: "Belanja kebutuhan di minimarket atau warung.", category: "Titip Belanja", icon: "basket", price: "Mulai Rp5.000", color: "orange", provider: "Belanja Yuk", rating: 4.9 },
  { name: "Pesan Makanan", description: "Pesan makanan dari warung sekitar kost.", category: "Makanan", icon: "food", price: "Mulai Rp3.000", color: "orange", provider: "Dapur Bu Rina", rating: 4.8 },
  { name: "Cleaning Kamar", description: "Jasa bersih-bersih kamar dan area kos.", category: "Cleaning", icon: "cleaning", price: "Mulai Rp25.000", color: "blue", provider: "Bersih Bersama", rating: 4.7 },
  { name: "Jasa Perbaikan", description: "Perbaikan listrik, keran, AC, dan kebutuhan lain.", category: "Perbaikan", icon: "repair", price: "Cek biaya", color: "blue", provider: "Teknik Jaya", rating: 4.9 },
];

export const categories = ["Semua", "Galon", "Titip Belanja", "Makanan", "Cleaning", "Perbaikan"];
