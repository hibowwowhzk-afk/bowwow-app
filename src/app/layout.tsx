import type { Metadata } from "next";
import "./globals.css";
import 'swiper/css';
import 'swiper/css/pagination';
import type { ReactNode } from "react";
import { geistSans, geistMono } from '@/app/fonts';
import HeaderGuard from '@/app/components/HeaderGuard';
import ActivityTracker from '@/app/components/ActivityTracker';

export const metadata: Metadata = {
    title: "MATCH",
    description: "MATCH",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ja">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ActivityTracker />

                {/* HeaderWrapper と BottomNav の出し分けを HeaderGuard で包む */}
                <HeaderGuard>{children}</HeaderGuard>
            </body>
        </html>
    );
}