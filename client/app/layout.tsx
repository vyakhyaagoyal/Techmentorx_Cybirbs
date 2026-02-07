import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import LeafDecoration from "./components/LeafDecoration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduGrow - Student Performance Dashboard",
  description:
    "Track student performance, identify learning gaps, and support mental wellness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-linear-to-br from-green-50 via-emerald-50 to-teal-50`}
      >
        <LeafDecoration />
        <div className="relative z-10 w-full">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
