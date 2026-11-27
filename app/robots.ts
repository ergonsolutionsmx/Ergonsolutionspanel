import type { MetadataRoute } from "next";

/** Panel interno: que ningún buscador lo indexe. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
