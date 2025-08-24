import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "INSPIRASINEE",
  description: "Cuci Sepatu Terbaik di Kota Malang",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased `}>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
