// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import 'swiper/css';
import 'swiper/css/pagination';
import type { ReactNode } from "react";
import { geistSans, geistMono } from '@/app/fonts';
import HeaderGuard from '@/app/components/HeaderGuard';

export const metadata: Metadata = {
  title: "Goukon Match",
  description: "合コン特化型マッチングサービス",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* HeaderWrapper と BottomNav の出し分けを HeaderGuard で包む */}
        <HeaderGuard>{children}</HeaderGuard>
      </body>
    </html>
  );
}