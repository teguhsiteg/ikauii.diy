import Link from "next/link";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export const metadata = {
  title: "Layanan Alumni - DPW IKA UII DIY",
  description:
    "Pusat layanan informasi, karir, dan administrasi bagi para alumni Universitas Islam Indonesia wilayah DIY.",
};

export default function LayananAlumniPage() {
  const services = [
    {
      id: "kta",
      title: "Pembuatan KTA",
      description:
        "Dapatkan identitas resmi keluarga besar alumni UII. Nikmati berbagai fasilitas eksklusif dan diskon di berbagai merchant mitra IKA UII.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
          />
        </svg>
      ),
      actionText: "Buat KTA Sekarang",
      link: "https://ika.uii.ac.id/registerkta",
      color: "blue",
    },
    {
      id: "karir",
      title: "Pusat Karir & Lowongan",
      description:
        "Akses informasi lowongan pekerjaan terbaru, program magang, serta peluang karir eksklusif dari jaringan luas alumni UII di berbagai instansi.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      actionText: "Cari Lowongan",
      link: "https://career.uii.ac.id/layanan/alumni/informasi-lowongan-pekerjaan/",
      color: "yellow",
    },
    {
      id: "mentoring",
      title: "Mentoring & Inkubasi",
      description:
        "Program bimbingan karir dan bisnis langsung dari alumni senior (expert) kepada fresh graduate untuk mempersiapkan diri menghadapi dunia profesional.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      actionText: "Daftar Mentoring",
      link: "#",
      color: "green",
    },
    {
      id: "legalisir",
      title: "Bantuan Administrasi Akademik",
      description:
        "Panduan lengkap dan pintasan layanan untuk pengajuan legalisir ijazah, transkrip nilai, dan dokumen akademik lainnya langsung ke kampus pusat.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
          />
        </svg>
      ),
      actionText: "Info Akademik",
      link: "https://academic.uii.ac.id/",
      color: "purple",
    },
    {
      id: "beasiswa",
      title: "Beasiswa IKA UII",
      description:
        "Salurkan kontribusi Anda melalui dana abadi alumni, atau daftarkan diri/kerabat untuk mendapatkan bantuan pendidikan dari ikatan alumni.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      actionText: "Beasiswa UII",
      link: "https://www.uii.ac.id/beasiswa/",
      color: "red",
    },
  ];

  return (
    <>
      <NavbarPublic />
      <main className="bg-slate-50 min-h-screen pt-32 pb-20">
        {/* HEADER SECTION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h4 className="text-yellow-600 font-bold tracking-widest uppercase text-xs mb-3 flex items-center justify-center gap-3">
            <span className="w-8 h-px bg-yellow-500"></span>
            Pusat Pelayanan
            <span className="w-8 h-px bg-yellow-500"></span>
          </h4>
          <h1 className="text-4xl md:text-5xl font-black text-blue-950 mb-6 tracking-tight">
            Layanan Alumni UII
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Kami hadir untuk memberikan kemudahan, fasilitas, dan wadah
            pengembangan diri bagi seluruh keluarga besar alumni Universitas
            Islam Indonesia, khususnya di wilayah Daerah Istimewa Yogyakarta.
          </p>
        </div>

        {/* SERVICES GRID */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon Container */}
                <div
                  className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transition-colors
                  ${service.color === "blue" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" : ""}
                  ${service.color === "yellow" ? "bg-yellow-50 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white" : ""}
                  ${service.color === "green" ? "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white" : ""}
                  ${service.color === "purple" ? "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white" : ""}
                  ${service.color === "red" ? "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white" : ""}
                `}
                >
                  {service.icon}
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-bold text-blue-950 mb-3 leading-snug">
                  {service.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">
                  {service.description}
                </p>

                {/* Action Button */}
                <Link
                  href={service.link}
                  className={`inline-flex items-center justify-between w-full px-5 py-3.5 rounded-xl text-sm font-bold transition-colors
                  ${service.color === "blue" ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : ""}
                  ${service.color === "yellow" ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : ""}
                  ${service.color === "green" ? "bg-green-50 text-green-700 hover:bg-green-100" : ""}
                  ${service.color === "purple" ? "bg-purple-50 text-purple-700 hover:bg-purple-100" : ""}
                  ${service.color === "red" ? "bg-red-50 text-red-700 hover:bg-red-100" : ""}
                `}
                >
                  {service.actionText}
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>
            ))}

            {/* KARTU BANTUAN / KONTAK (Kartu Spesial) */}
            <div
              className="bg-blue-950 rounded-[2rem] p-8 shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-8"
              style={{ animationDelay: `500ms` }}
            >
              {/* Hiasan Latar */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-800/50 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-yellow-500/20 blur-2xl"></div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-3">
                  Butuh Bantuan Lainnya?
                </h3>
                <p className="text-blue-200 text-sm leading-relaxed mb-8">
                  Tim kesekretariatan DPW IKA UII DIY siap membantu segala
                  keperluan administrasi dan informasi alumni Anda.
                </p>
                <a
                  href="https://wa.me/6285179594146" // Ganti dengan nomor WA resmi
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-blue-950 rounded-xl text-sm font-extrabold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.883-.733-1.48-1.638-1.653-1.935-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Hubungi Kesekretariatan
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterPublic />
    </>
  );
}
