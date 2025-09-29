// app/fonts.ts
import { Geist, Geist_Mono } from "next/font/google";

// フォント設定
export const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});