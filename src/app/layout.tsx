import type { Metadata } from "next";
import Link from "next/link";
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
  title: "WonderLens Design Studio",
  description: "Interactive game design studio for WonderLens educational activities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        {/* Global app shell nav. Sticky so the editor's full-viewport
            three-panel layout still works without bleeding off-screen — the
            nav stays pinned at the top while the page content scrolls
            underneath. Section 3a editor / gallery headers layer their own
            page-context bar below this strip. */}
        <nav className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/85 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60">
          <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors"
            >
              WonderLens Design Studio
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Upload
              </Link>
              <Link
                href="/library"
                className="px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Library
              </Link>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
