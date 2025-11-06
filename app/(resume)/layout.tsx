import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quang Trinh Khac - Resume",
  description: "Private resume page",
  robots: "noindex, nofollow, noarchive, nosnippet",
  openGraph: {
    title: "Quang Trinh Khac - Resume",
    description: "Private resume page",
    type: "profile",
  },
};

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <div style={inter.style}></div>
    </>
  );
}
