import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "PORTAL ALUMNI";
  const subtitle = searchParams.get("subtitle") || "DPW IKA UII DIY";

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0B2239", // Warna biru khas IKA UII
        backgroundImage:
          "radial-gradient(circle at 25px 25px, #152B5B 2%, transparent 0%), radial-gradient(circle at 75px 75px, #152B5B 2%, transparent 0%)",
        backgroundSize: "100px 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "white",
          padding: "40px 60px",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          maxWidth: "90%",
        }}
      >
        <img
          src="https://ikadiy.uii.ac.id/logo-dpp-ika.png"
          alt="Logo"
          width={120}
          height={120}
          style={{ marginBottom: "20px" }}
        />
        <h1
          style={{
            fontSize: title.length > 25 ? "45px" : "60px",
            fontWeight: "900",
            color: "#0B2239",
            margin: "0 0 10px 0",
            textAlign: "center",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: "#FCD116",
            margin: 0,
            letterSpacing: "2px",
            textAlign: "center",
          }}
        >
          {subtitle}
        </p>
        <div
          style={{
            display: "flex",
            marginTop: "30px",
            backgroundColor: "#1A73E8",
            color: "white",
            padding: "15px 40px",
            borderRadius: "50px",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          KLIK UNTUK AKSES ➔
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
