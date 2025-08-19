import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VideoGrid from "@/components/VideoGrid";

const Index = () => {
  // Mock data for video categories
  const actionVideos = [
    {
      id: "1",
      title: "Pertempuran Epik Superhero",
      thumbnail: "https://images.unsplash.com/photo-1518930259200-6b5c4ec23d3a?w=400&h=225&fit=crop",
      duration: "2j 15m",
      views: "5.2M",
      creator: "Action Studios",
      category: "Aksi"
    },
    {
      id: "2", 
      title: "Chase Scene Ultimate",
      thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
      duration: "1j 30m",
      views: "3.1M",
      creator: "Thriller Pro",
      category: "Aksi"
    },
    {
      id: "3",
      title: "Misi Rahasia Agen",
      thumbnail: "https://images.unsplash.com/photo-1563993297290-609c9d9b4031?w=400&h=225&fit=crop",
      duration: "2j 5m",
      views: "4.8M",
      creator: "Spy Films",
      category: "Aksi"
    },
    {
      id: "4",
      title: "Petualangan Futuristik",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=225&fit=crop",
      duration: "1j 45m",
      views: "2.9M",
      creator: "Sci-Fi World",
      category: "Aksi"
    },
    {
      id: "5",
      title: "Balas Dendam Pahlawan",
      thumbnail: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=225&fit=crop",
      duration: "2j 20m",
      views: "6.1M",
      creator: "Hero Studios",
      category: "Aksi"
    }
  ];

  const comedyVideos = [
    {
      id: "6",
      title: "Stand Up Comedy Terbaik",
      thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=225&fit=crop",
      duration: "1j 15m",
      views: "8.5M",
      creator: "Comedy Central",
      category: "Komedi"
    },
    {
      id: "7",
      title: "Sitcom Keluarga Lucu",
      thumbnail: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&h=225&fit=crop",
      duration: "45m",
      views: "12.3M",
      creator: "Family Fun",
      category: "Komedi"
    },
    {
      id: "8",
      title: "Parodi Film Terkenal",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop",
      duration: "1j 30m",
      views: "7.2M",
      creator: "Parody Plus",
      category: "Komedi"
    },
    {
      id: "9",
      title: "Sketch Comedy Viral",
      thumbnail: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=225&fit=crop",
      duration: "35m",
      views: "15.1M",
      creator: "Viral Vids",
      category: "Komedi"
    },
    {
      id: "10",
      title: "Komedi Romantis Modern",
      thumbnail: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=225&fit=crop",
      duration: "1j 50m",
      views: "9.8M",
      creator: "Romance Plus",
      category: "Komedi"
    }
  ];

  const documentaryVideos = [
    {
      id: "11",
      title: "Eksplorasi Laut Dalam",
      thumbnail: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=225&fit=crop",
      duration: "2j 30m",
      views: "4.2M",
      creator: "Ocean Explorer",
      category: "Dokumenter"
    },
    {
      id: "12",
      title: "Kehidupan Satwa Afrika",
      thumbnail: "https://images.unsplash.com/photo-1549366021-9f761d040a94?w=400&h=225&fit=crop",
      duration: "1j 45m",
      views: "6.7M",
      creator: "Wildlife Pro",
      category: "Dokumenter"
    },
    {
      id: "13",
      title: "Sejarah Peradaban Kuno",
      thumbnail: "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=400&h=225&fit=crop",
      duration: "3j 15m",
      views: "3.5M",
      creator: "History Channel",
      category: "Dokumenter"
    },
    {
      id: "14",
      title: "Teknologi Masa Depan",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=225&fit=crop",
      duration: "1j 20m",
      views: "8.9M",
      creator: "Tech Insider",
      category: "Dokumenter"
    },
    {
      id: "15",
      title: "Perubahan Iklim Global",
      thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=225&fit=crop",
      duration: "2j 10m",
      views: "5.1M",
      creator: "Earth Watch",
      category: "Dokumenter"
    }
  ];

  const educationVideos = [
    {
      id: "16",
      title: "Matematika untuk Pemula",
      thumbnail: "https://images.unsplash.com/photo-1509228627152-72ae4c2d6cf0?w=400&h=225&fit=crop",
      duration: "1j 5m",
      views: "2.8M",
      creator: "Math Academy",
      category: "Edukasi"
    },
    {
      id: "17",
      title: "Belajar Bahasa Inggris",
      thumbnail: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=225&fit=crop",
      duration: "45m",
      views: "11.4M",
      creator: "English Pro",
      category: "Edukasi"
    },
    {
      id: "18",
      title: "Fisika Kuantum Sederhana",
      thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop",
      duration: "1j 30m",
      views: "1.9M",
      creator: "Physics Fun",
      category: "Edukasi"
    },
    {
      id: "19",
      title: "Programming untuk Anak",
      thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=225&fit=crop",
      duration: "2j 0m",
      views: "7.3M",
      creator: "Code Kids",
      category: "Edukasi"
    },
    {
      id: "20",
      title: "Kreativitas dan Seni",
      thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=225&fit=crop",
      duration: "1j 15m",
      views: "4.6M",
      creator: "Art Studio",
      category: "Edukasi"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        
        <div className="space-y-8">
          <VideoGrid title="Film Aksi Terpopuler" videos={actionVideos} />
          <VideoGrid title="Komedi Terfavorit" videos={comedyVideos} />
          <VideoGrid title="Dokumenter Pilihan" videos={documentaryVideos} />
          <VideoGrid title="Konten Edukasi" videos={educationVideos} />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-card/30 backdrop-blur-sm border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Streamverse
              </span>
            </div>
            <p className="text-muted-foreground">
              Platform streaming video terdepan dengan koleksi konten berkualitas tinggi
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              © 2024 Streamverse. Semua hak dilindungi.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
