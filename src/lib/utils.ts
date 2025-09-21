// lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind クラス名を安全に結合するヘルパー
 */
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}
