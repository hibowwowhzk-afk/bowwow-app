'use client';


import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // 正確にマッチさせるパス
    const exactHidePaths = ["/"];
    // 接頭辞でマッチさせるパス
    const prefixHidePaths = ["/login"];

    const isExactHide = exactHidePaths.includes(pathname);
    const isPrefixHide = prefixHidePaths.some((p) => pathname.startsWith(p));

    if (isExactHide || isPrefixHide) {
        return <>{children}</>; // ヘッダーなし・余白なし
    }

    return (
        <>
        <Header />
        <div className="pt-16">{children}</div>
        </>
    );
}