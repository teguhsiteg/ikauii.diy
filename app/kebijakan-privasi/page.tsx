import Link from "next/link";

export default function KebijakanPrivasiPage() {
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
            Kebijakan Privasi
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Komitmen Kami Terhadap Keamanan Data Anda
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
              Pendahuluan
            </h2>
            <p className="pl-11 text-justify">
              Dewan Pimpinan Wilayah Ikatan Keluarga Alumni Universitas Islam
              Indonesia Daerah Istimewa Yogyakarta (DPW IKA UII DIY) berkomitmen
              penuh untuk melindungi privasi dan keamanan data pengguna kami.
              Kebijakan ini menjelaskan standar operasional kami dalam
              mengumpulkan, mengelola, dan menjaga kerahasiaan data pribadi Anda
              di seluruh platform layanan digital kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                2
              </span>
              Pengumpulan Data Pribadi
            </h2>
            <div className="pl-11">
              <p className="mb-3 text-justify">
                Kami hanya mengumpulkan informasi yang secara sukarela Anda
                berikan saat mendaftar atau menggunakan layanan kami. Informasi
                tersebut meliputi namun tidak terbatas pada:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                <li>
                  <strong className="text-slate-800">
                    Data Identitas Diri:
                  </strong>{" "}
                  Nama lengkap, alamat email, nomor telepon/WhatsApp, dan pas
                  foto.
                </li>
                <li>
                  <strong className="text-slate-800">
                    Data Akademik & Profesi (Khusus Alumni):
                  </strong>{" "}
                  Nomor Induk Mahasiswa (NIM), fakultas, program studi, tahun
                  angkatan, serta informasi instansi atau profesi saat ini.
                </li>
                <li>
                  <strong className="text-slate-800">
                    Data Layanan & Partisipasi Event:
                  </strong>{" "}
                  Alamat pengiriman fisik, ukuran pakaian (jersey), rekam
                  aktivitas digital untuk perlombaan (seperti <i>Virtual Run</i>
                  ), serta riwayat partisipasi pelatihan/kelas.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                3
              </span>
              Penggunaan Data
            </h2>
            <div className="pl-11">
              <p className="mb-3 text-justify">
                Data yang kami himpun murni digunakan untuk menunjang kelancaran
                administrasi dan operasional layanan organisasi, antara lain:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-blue-500 text-justify">
                <li>
                  Proses verifikasi dan validasi keanggotaan untuk penerbitan
                  Kartu Tanda Anggota Elektronik (E-KTA).
                </li>
                <li>
                  Distribusi sertifikat penghargaan, kelulusan kelas, maupun
                  pengiriman perlengkapan acara fisik ke alamat yang terdaftar.
                </li>
                <li>
                  Pengiriman informasi administratif seperti pembaruan status
                  akun, keamanan kata sandi, dan pengumuman resmi terkait agenda
                  organisasi.
                </li>
              </ul>
            </div>
          </section>

          {/* 🔥 SEKSI BARU: KEBIJAKAN COOKIE 🔥 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                4
              </span>
              Penggunaan Cookie & Teknologi Pelacakan
            </h2>
            <p className="pl-11 text-justify">
              Website kami menggunakan "Cookie" (berkas teks kecil yang disimpan
              di perangkat Anda) untuk memastikan sistem berjalan dengan cepat
              dan aman. Kami membagi penggunaan cookie ke dalam dua jenis:
              <strong> Cookie Esensial</strong> yang wajib ada agar Anda bisa
              masuk (login) ke dalam sistem secara aman, dan{" "}
              <strong>Cookie Analitik/Fungsional</strong> yang membantu kami
              mengukur performa website. Kami tidak akan memuat cookie analitik
              pihak ketiga sebelum Anda memberikan persetujuan (<i>consent</i>)
              melalui banner yang tampil di layar Anda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                5
              </span>
              Pembagian Data dengan Pihak Ketiga
            </h2>
            <p className="pl-11 text-justify">
              Privasi Anda adalah prioritas kami. Kami{" "}
              <strong>tidak menjual, menyewakan, atau memperdagangkan</strong>{" "}
              data pribadi Anda kepada pihak luar untuk tujuan pemasaran. Akses
              data hanya diberikan secara terbatas kepada mitra penyedia layanan
              kami (seperti jasa ekspedisi logistik atau mitra pemrosesan
              pembayaran) semata-mata untuk memfasilitasi transaksi atau layanan
              yang Anda minta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                6
              </span>
              Keamanan Penyimpanan Data
            </h2>
            <p className="pl-11 text-justify">
              Kami menerapkan standar keamanan industri untuk melindungi
              informasi Anda dari akses yang tidak sah. Seluruh lalu lintas
              transmisi data dilindungi oleh enkripsi, dan kata sandi Anda
              disimpan menggunakan teknologi hashing (penyandian sepihak)
              sehingga tidak dapat dibaca oleh siapa pun, termasuk administrator
              kami. Namun demikian, kami mengingatkan bahwa tidak ada sistem
              transmisi internet yang 100% aman, sehingga Anda juga diimbau
              untuk menjaga kerahasiaan kredensial akun Anda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                7
              </span>
              Hak & Pengendalian Pengguna
            </h2>
            <p className="pl-11 text-justify">
              Sebagai pemilik data, Anda memiliki hak penuh untuk memperbarui
              atau mengoreksi informasi Anda melalui dashboard portal. Jika Anda
              memutuskan untuk menghentikan penggunaan layanan kami dan ingin
              menghapus seluruh rekam jejak data pribadi Anda secara permanen,
              Anda dapat mengajukan permohonan resmi kepada pengelola sistem
              melalui saluran kontak yang tersedia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                8
              </span>
              Pembaruan Kebijakan
            </h2>
            <p className="pl-11 text-justify">
              Kami dapat memperbarui atau merevisi Kebijakan Privasi ini secara
              berkala untuk mematuhi regulasi hukum pelindungan data yang
              berlaku atau menyesuaikan dengan fitur layanan yang baru.
              Perubahan yang signifikan akan kami komunikasikan melalui website
              atau email. Penggunaan berkelanjutan atas layanan kami setelah
              adanya perubahan dianggap sebagai persetujuan Anda terhadap
              kebijakan yang baru.
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
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-slate-400">
              <Link
                href="/kebijakan-privasi"
                className="text-white hover:text-blue-400 transition-colors"
              >
                Kebijakan Privasi
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
