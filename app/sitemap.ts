import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://p50sports.com";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/terminos`, lastModified: now },
    { url: `${base}/privacidad`, lastModified: now },
    { url: `${base}/juego-responsable`, lastModified: now },
  ];
}
