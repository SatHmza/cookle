import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Cookle — What should I cook tonight?",
  description:
    "Type in your ingredients and Cookle instantly decides what to cook. No scrolling, no browsing — just a decision.",
  twitter: {
    card: "summary_large_image",
    title: "Cookle — What should I cook tonight?",
    description: "Type in your ingredients and Cookle instantly decides what to cook.",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full font-sans antialiased" style={{ backgroundColor: "#FDF8F3" }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
