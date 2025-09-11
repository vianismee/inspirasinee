import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inspirasinee Admin",
    short_name: "Inspirasinee",
    description: "Aplikasi Admin dan Tracking untuk Inspirasinee",
    start_url: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0243fe",
    icons: [
      {
        src: "/asset/main_logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/asset/main_logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
