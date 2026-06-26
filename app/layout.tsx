import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ variable: "--font-display", subsets: ["latin"] });
const inter = Inter({ variable: "--font-body", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "CloseIt — AI Lead Automation",
  description: "Capture leads, score with AI, follow up automatically. Nothing falls through the cracks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
