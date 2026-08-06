import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans relative selection:bg-blue-200">
      {/* 🔥 WATERMARK RAKSASA 🔥 */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <img
          src="/logo-dpp-ika.png"
          alt="Watermark"
          className="w-[120%] md:w-[800px] h-auto opacity-[0.02] grayscale transform -rotate-12"
        />
      </div>

      {/* 🔥 HEADER / NAVBAR 🔥 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo IKA UII"
              className="h-8 w-auto"
            />
            <div className="hidden sm:block border-l border-slate-300 pl-3 ml-1">
              <span className="font-bold text-slate-800 tracking-tight text-sm uppercase">
                Portal Layanan IKA UII DIY
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-full"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* 🔥 MAIN CONTENT 🔥 */}
      <main className="flex-grow relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Kebijakan Cookie
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Penjelasan Penggunaan Cookie dan Teknologi Pelacakan
          </p>
          <div className="mt-4 inline-block bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
            Pembaruan Terakhir:{" "}
            {new Date().toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 md:p-12 text-slate-600 space-y-10 leading-relaxed text-[15px]">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                1
              </span>
              Apa itu Cookie?
            </h2>
            <p className="pl-11 text-justify">
              Cookie adalah berkas teks kecil yang disimpan di komputer, ponsel pintar, atau perangkat lain milik Anda saat mengunjungi sebuah situs web. Cookie digunakan secara luas untuk memastikan situs web berfungsi dengan semestinya, meningkatkan efisiensi, dan memberikan informasi analitik kepada pemilik situs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                2
              </span>
              Mengapa Kami Menggunakan Cookie?
            </h2>
            <div className="pl-11">
              <p className="mb-3 text-justify">
                Portal Layanan DPW IKA UII DIY menggunakan cookie untuk berbagai tujuan, di antaranya:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                <li>
                  <strong className="text-slate-800">Keamanan dan Autentikasi:</strong> Memastikan Anda dapat masuk (login) ke dashboard anggota dengan aman, mencegah aktivitas mencurigakan, dan melindungi data akun Anda.
                </li>
                <li>
                  <strong className="text-slate-800">Fungsionalitas:</strong> Mengingat preferensi Anda agar Anda tidak perlu memasukkan informasi yang sama berkali-kali (seperti status login).
                </li>
                <li>
                  <strong className="text-slate-800">Analitik dan Kinerja:</strong> Membantu kami memahami bagaimana pengguna berinteraksi dengan portal kami, halaman mana yang sering dikunjungi, serta mendeteksi adanya error (kesalahan sistem). Informasi ini digunakan semata-mata untuk meningkatkan kualitas layanan aplikasi.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                3
              </span>
              Jenis Cookie yang Kami Gunakan
            </h2>
            <div className="pl-11">
              <ul className="list-disc pl-5 space-y-4 marker:text-blue-500 text-justify">
                <li>
                  <strong className="text-slate-800">Cookie Esensial (Wajib):</strong> Cookie jenis ini mutlak diperlukan agar fitur utama portal dapat beroperasi, seperti Firebase Authentication untuk sistem login. Karena sifatnya wajib demi alasan keamanan dan operasional dasar, Anda tidak dapat menonaktifkannya dari sistem kami.
                </li>
                <li>
                  <strong className="text-slate-800">Cookie Pihak Ketiga (Opsional):</strong> Kami mungkin menggunakan layanan pihak ketiga, seperti alat analitik web, yang menempatkan cookie di perangkat Anda. Cookie pihak ketiga ini tunduk pada kebijakan privasi pihak ketiga tersebut dan dapat Anda blokir melalui pengaturan peramban (browser) Anda.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                4
              </span>
              Cara Mengelola Cookie Anda
            </h2>
            <p className="pl-11 text-justify">
              Sebagian besar peramban web (seperti Chrome, Safari, Edge, Mozilla Firefox) mengizinkan Anda untuk menghapus atau menolak cookie melalui pengaturan peramban. Perlu diketahui bahwa jika Anda memilih untuk memblokir Cookie Esensial dari situs kami, Anda mungkin tidak akan dapat login ke dashboard akun Anda atau beberapa fitur penting mungkin tidak akan berfungsi dengan optimal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                5
              </span>
              Hubungi Kami
            </h2>
            <p className="pl-11 text-justify">
              Jika Anda memiliki pertanyaan lebih lanjut mengenai penggunaan cookie di portal layanan ini, Anda dapat merujuk pada <Link href="/kebijakan-privasi" className="text-blue-600 hover:underline">Kebijakan Privasi</Link> kami secara keseluruhan, atau menghubungi tim pengelola dan administrator IKA UII DIY.
            </p>
          </section>
        </div>
      </main>

      {/* 🔥 FOOTER CORPORATE 🔥 */}
      <footer className="bg-slate-900 border-t border-slate-800 relative z-10 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Footer Branding */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg">
                <img
                  src="/logo-dpp-ika.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-white font-black text-base tracking-widest uppercase">
                  DPW IKA UII DIY
                </h3>
                <p className="text-slate-400 text-[11px] font-bold tracking-[0.2em] mt-1">
                  Integrity • Syiar • Professional
                </p>
              </div>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-400">
              <Link
                href="/kebijakan-privasi"
                className="hover:text-white transition-colors"
              >
                Kebijakan Privasi
              </Link>
              <span className="text-slate-700 hidden md:inline">|</span>
              <Link
                href="/cookie-policy"
                className="text-white hover:text-blue-400 transition-colors"
              >
                Kebijakan Cookie
              </Link>
              <span className="text-slate-700 hidden md:inline">|</span>
              <Link
                href="/syarat-ketentuan"
                className="hover:text-white transition-colors"
              >
                Syarat & Ketentuan
              </Link>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/50 text-center flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} DPW IKA UII Yogyakarta. Hak
              Cipta Dilindungi Undang-Undang.
            </p>
            <p>Sistem Informasi Manajemen Terpadu</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
