import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import GameLayout from "./(game)/layout";

export const metadata: Metadata = {
  title: "OGame Regulus | Sci-Fi Command Dashboard",
  description: "High-performance browser-based space strategy MMO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-[#020408] text-zinc-100 antialiased overflow-hidden"
      >
        <Providers>
          <GameLayout>{children}</GameLayout>
        </Providers>
      </body>
    </html>
  );
}
