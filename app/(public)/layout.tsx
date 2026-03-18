import NavbarPublic from "@/components/layout/NavbarPublic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavbarPublic />
      {/* pt-20 (padding-top 80px) ditambahkan agar konten tidak tertutup Navbar yang fixed */}
      <main className="flex-grow pt-20">{children}</main>
    </div>
  );
}
