"use client";

import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export default function TentangKamiPage() {
  return (
    <div className={`${roboto.className} min-h-screen bg-white text-slate-800`}>
      <NavbarPublic />

      {/* HERO SECTION */}
      <section className="relative pt-60 pb-28 bg-[#0F2147] text-white text-center px-6">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.uii.ac.id/wp-content/uploads/2017/09/UII-Central-Building.jpg')] bg-cover bg-center"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Tentang IKA UII DIY
          </h1>
          <p className="text-lg text-slate-300">
            Menjalin silaturahmi, menebar manfaat, dan bersinergi membangun
            almamater serta negeri.
          </p>
        </div>
      </section>

      {/* STORY SECTION */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none text-slate-600">
          <h2 className="text-3xl font-black text-[#0F2147] mb-8 text-center">
            Jejak Langkah Kami
          </h2>
          <p className="mb-6 leading-relaxed">
            Dewan Pengurus Wilayah (DPW) Ikatan Keluarga Alumni Universitas
            Islam Indonesia Daerah Istimewa Yogyakarta merupakan wadah resmi
            bagi seluruh alumni UII yang berdomisili atau berkarya di wilayah
            Yogyakarta. Didirikan atas semangat kekeluargaan, kami berkomitmen
            untuk menjadi jembatan antara dunia alumni dengan almamater
            tercinta.
          </p>
          <p className="mb-6 leading-relaxed">
            Sejak berdiri, IKA UII DIY terus bertransformasi menjadi organisasi
            yang adaptif terhadap perkembangan zaman, menghimpun potensi alumni
            dari berbagai profesi, mulai dari akademisi, praktisi bisnis, hingga
            birokrat, guna memberikan kontribusi nyata bagi pembangunan daerah
            dan nasional.
          </p>
        </div>
      </section>

      {/* CORE VALUES SECTION */}
      <section className="py-24 bg-[#F8F9FA] px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-16 text-[#0F2147]">
            Nilai-Nilai Organisasi
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Silaturahmi",
                desc: "Membangun ikatan persaudaraan yang kuat antar alumni lintas angkatan dan fakultas.",
              },
              {
                title: "Kontributif",
                desc: "Berbagi keahlian dan sumber daya untuk almamater, sesama alumni, dan masyarakat.",
              },
              {
                title: "Integritas",
                desc: "Menjunjung tinggi nilai-nilai Islam dan etika profesional dalam setiap gerak langkah organisasi.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
              >
                <h4 className="font-black text-xl mb-4 text-[#0F2147]">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-black mb-12 text-[#0F2147]">
          Visi & Misi
        </h2>
        <div className="bg-[#0F2147] text-white p-10 md:p-16 rounded-3xl text-left shadow-2xl">
          <h4 className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-4">
            Visi
          </h4>
          <p className="text-xl md:text-2xl font-bold mb-10 leading-snug">
            "Menjadi wadah alumni yang integratif, solutif, dan bermanfaat bagi
            masyarakat luas dengan berlandaskan nilai-nilai keislaman."
          </p>
          <h4 className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-4">
            Misi
          </h4>
          <ul className="space-y-4 text-slate-300">
            <li>
              • Mempererat tali silaturahmi antar alumni UII di wilayah DIY.
            </li>
            <li>
              • Mengembangkan jejaring profesional dan bisnis bagi anggota.
            </li>
            <li>• Memberikan dukungan aktif bagi pengembangan almamater.</li>
            <li>
              • Berperan serta dalam aksi sosial dan pengabdian masyarakat.
            </li>
          </ul>
        </div>
      </section>

      <FooterPublic />
    </div>
  );
}
