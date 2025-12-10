import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Serika Downloader - Fast Video & Audio Downloader",
  description: "Download videos and music in any format with yt-dlp. Support for 4K, lossless audio (FLAC, WAV), and 1000+ sites. Fast, modular, and open-source.",
  keywords: ["video downloader", "youtube downloader", "yt-dlp", "music downloader", "flac", "4k downloader"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
