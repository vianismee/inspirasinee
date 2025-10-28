import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: "INSPIRASINEE",
  description: "Cuci Sepatu Terbaik di Kota Malang",
  manifest: "/manifest.json",
  icons: {
    apple: "/asset/apple-touch-icon.png", // Ini akan membuat <link rel="apple-touch-icon" ...>
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased `}>
        <AuthProvider>
          <main>{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
