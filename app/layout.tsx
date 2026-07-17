import type { Metadata } from "next";
import "./globals.css";
import { OWNER } from "@/lib/profile";

export const metadata: Metadata = {
  title: `${OWNER.name} — Portfolio`,
  description: OWNER.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
