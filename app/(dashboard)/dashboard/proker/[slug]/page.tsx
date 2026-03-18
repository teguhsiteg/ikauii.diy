import RuangKerjaProkerDinamic from "./ProkerClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <RuangKerjaProkerDinamic slug={resolvedParams.slug} />;
}