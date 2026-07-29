import Link from "next/link";

export default function SyaratKetentuanPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans relative selection:bg-yellow-200">
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
            Syarat & Ketentuan Layanan
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Dokumen Legal Penggunaan Ekosistem Digital DPW IKA UII DIY
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
              Penerimaan Syarat
            </h2>
            <p className="pl-11 text-justify">
              Dengan mendaftar, mengakses, atau menggunakan seluruh ekosistem
              Portal Layanan DPW IKA UII DIY (mencakup Portal Anggota,
              Masterclass/LMS, dan Virtual Run), Anda secara sadar dan sah
              secara hukum menyetujui untuk terikat oleh Syarat dan Ketentuan
              ini. Jika Anda tidak menyetujui salah satu atau seluruh ketentuan
              ini, Anda dipersilakan untuk menghentikan penggunaan layanan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                2
              </span>
              Ketentuan Pembuatan Akun
            </h2>
            <div className="pl-11">
              <p className="mb-3 text-justify">
                Sistem ini melayani tiga jenis pendaftaran akun yang memiliki
                otoritas berbeda:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-blue-500 text-justify">
                <li>
                  <strong>Akun Anggota/Alumni:</strong> Dikhususkan bagi lulusan
                  sah Universitas Islam Indonesia (UII). Akun ini memberikan
                  akses ke E-KTA dan hak suara/partisipasi dalam organisasi.
                  Admin berhak membekukan akun jika ditemukan ketidaksesuaian
                  data akademik.
                </li>
                <li>
                  <strong>Akun Peserta Publik:</strong> Digunakan khusus untuk
                  masyarakat umum yang ingin mendaftar layanan pembelajaran
                  (Masterclass) atau event (Virtual Run). Akun ini tidak
                  memberikan hak keanggotaan IKA UII.
                </li>
                <li>
                  Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi (
                  <i>password</i>). Segala aktivitas yang terjadi melalui akun
                  Anda dianggap sebagai tanggung jawab sah pengguna.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                3
              </span>
              Layanan Masterclass (Learning Management System)
            </h2>
            <div className="pl-11">
              <ul className="list-disc pl-5 space-y-2 marker:text-blue-500 text-justify">
                <li>
                  <strong>Hak Akses:</strong> Pembelian atau pendaftaran kelas
                  memberikan lisensi pribadi dan non-eksklusif untuk menonton
                  dan membaca materi di dalam platform. Akun tidak boleh
                  dipindahtangankan atau digunakan bersama (
                  <i>sharing account</i>).
                </li>
                <li>
                  <strong>Kekayaan Intelektual:</strong> Segala bentuk materi
                  video, dokumen PDF, dan kurikulum adalah hak cipta instruktur
                  dan DPW IKA UII DIY. Pengguna <strong>dilarang keras</strong>{" "}
                  merekam layar (<i>screen recording</i>), mengunduh secara
                  ilegal, atau mendistribusikan ulang materi berbayar untuk
                  tujuan komersial maupun non-komersial.
                </li>
                <li>
                  <strong>Sertifikat:</strong> E-Certificate hanya akan
                  diterbitkan melalui sistem jika pengguna telah menyelesaikan
                  100% modul yang diwajibkan.
                </li>
                <li>
                  <strong>Kebijakan Pengembalian Dana (Refund):</strong> Seluruh
                  transaksi pembelian kelas bersifat final. Tidak ada
                  pengembalian dana setelah akses kelas diberikan, kecuali
                  terjadi kesalahan sistem fatal yang tidak dapat diselesaikan
                  oleh tim teknis kami.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                4
              </span>
              Layanan Event & Virtual Run
            </h2>
            <div className="pl-11">
              <ul className="list-disc pl-5 space-y-2 marker:text-blue-500 text-justify">
                <li>
                  Peserta menjamin bahwa secara medis dan fisik berada dalam
                  kondisi sehat dan mampu untuk mengikuti kegiatan Virtual Run.
                  Penyelenggara dibebaskan dari segala tuntutan atas cedera atau
                  insiden kesehatan yang dialami peserta.
                </li>
                <li>
                  Pengiriman data rekaman lari (seperti tangkapan layar
                  Strava/Garmin) harus valid dan jujur. Tindakan memanipulasi
                  data lari akan mengakibatkan diskualifikasi tanpa pengembalian
                  dana tiket.
                </li>
                <li>
                  Pengiriman paket *Racepack* akan dikirimkan ke alamat yang
                  dimasukkan saat pendaftaran. Kegagalan pengiriman akibat
                  kesalahan penulisan alamat menjadi tanggung jawab peserta.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                5
              </span>
              Pembayaran & Transaksi
            </h2>
            <p className="pl-11 text-justify">
              Semua biaya layanan, termasuk pendaftaran event dan pembelian
              kelas Masterclass, akan diinformasikan secara transparan. Jika
              pembayaran dilakukan melalui metode transfer manual, layanan baru
              akan diaktifkan setelah Admin melakukan verifikasi (waktu
              operasional 1x24 jam). Simpan bukti transfer Anda sebagai bukti
              sah jika terjadi kendala verifikasi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                6
              </span>
              Sanksi & Pemblokiran Akun
            </h2>
            <p className="pl-11 text-justify">
              DPW IKA UII DIY berhak untuk menangguhkan atau mencabut secara
              permanen akses pengguna ke seluruh portal layanan, tanpa
              pemberitahuan sebelumnya, apabila ditemukan indikasi pelanggaran
              terhadap Syarat & Ketentuan ini, penipuan, pembajakan karya
              intelektual, atau tindakan yang mencemarkan nama baik organisasi
              Universitas Islam Indonesia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100">
                7
              </span>
              Perubahan Ketentuan
            </h2>
            <p className="pl-11 text-justify">
              Syarat dan Ketentuan ini dapat diubah atau diperbarui
              sewaktu-waktu tanpa pemberitahuan langsung secara individual.
              Pengguna sangat disarankan untuk secara berkala meninjau halaman
              ini. Melanjutkan penggunaan layanan setelah adanya pembaruan
              berarti Anda menerima dan menyetujui perubahan tersebut.
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
                className="hover:text-white transition-colors"
              >
                Kebijakan Privasi
              </Link>
              <span className="text-slate-700 hidden md:inline">|</span>
              <Link
                href="/syarat-ketentuan"
                className="text-white hover:text-yellow-400 transition-colors"
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
