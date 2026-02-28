import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar, InstallPrompt } from "@/components/ServiceWorker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Last Mile Splitter — Share rides from the station",
  description:
    "Find or post last-mile ride shares from transit stations. Post a ride in one sentence, join in one tap.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RideSplit",
  },
};

export const viewport: Viewport = {
  themeColor: "#2c5364",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  );
}
