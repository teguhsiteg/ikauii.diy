import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/checkout/", "/dashboard/"],
    },
    sitemap: "https://ikadiy.uii.ac.id/sitemap.xml",
  };
}
