import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { verifyVrAdmin } from "@/lib/vr-admin-auth";

// ============================================================
// ROUTE ADMIN SETTINGS VR (SERVER-SIDE)
// Semua operasi tulis halaman /admin-vr/pengaturan dipindah ke
// sini supaya Firestore rules bisa tetap mengunci client
// (settings & promo_codes: write hanya isAdmin).
// Autentikasi: Firebase ID Token (Bearer) + role admin (lihat
// lib/vr-admin-auth.ts — mendukung admin/super_admin/superadmin).
// ============================================================

type SettingsAction =
  | "save-settings" // { settings }
  | "add-promo" // { promo }
  | "toggle-promo" // { id, isActive }
  | "delete-promo"; // { id }

export async function POST(request: Request) {
  const admin = await verifyVrAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: hanya admin yang bisa melakukan aksi ini" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const action: SettingsAction = body.action;

    if (!action) {
      return NextResponse.json(
        { error: "action wajib diisi" },
        { status: 400 },
      );
    }

    switch (action) {
      case "save-settings": {
        const settings = body.settings;
        if (!settings || typeof settings !== "object") {
          return NextResponse.json(
            { error: "settings wajib diisi" },
            { status: 400 },
          );
        }

        await dbAdmin
          .collection("settings")
          .doc("virtual_run")
          .set(settings, { merge: true });

        return NextResponse.json({ success: true });
      }

      case "add-promo": {
        const promo = body.promo;
        if (!promo || typeof promo !== "object") {
          return NextResponse.json(
            { error: "promo wajib diisi" },
            { status: 400 },
          );
        }

        const ref = await dbAdmin.collection("promo_codes").add({
          ...promo,
          kuotaTerpakai: 0,
          createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, id: ref.id });
      }

      case "toggle-promo": {
        const { id, isActive } = body;
        if (!id) {
          return NextResponse.json(
            { error: "id wajib diisi" },
            { status: 400 },
          );
        }

        await dbAdmin
          .collection("promo_codes")
          .doc(id)
          .update({ isActive: !!isActive });

        return NextResponse.json({ success: true });
      }

      case "delete-promo": {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { error: "id wajib diisi" },
            { status: 400 },
          );
        }

        await dbAdmin.collection("promo_codes").doc(id).delete();

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Aksi tidak dikenal" },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("[vr-admin-settings] Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses aksi admin" },
      { status: 500 },
    );
  }
}
