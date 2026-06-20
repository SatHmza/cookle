import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Cookle 🧌 — What should I cook?",
  description:
    "Type in your ingredients and let the kitchen gremlin decide what you're cooking tonight.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-white font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
