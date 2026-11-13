'use client';

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper({
    children
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();

    // 正確にマッチさせるパス
    const exactHidePaths = [
        "/",
        "/register/profile/first"
    ];

    // 接頭辞でマッチさせるパス
    const prefixHidePaths = ["/login"];

    const isExactHide = exactHidePaths.includes(pathname);
    const isPrefixHide = prefixHidePaths.some((p) =>
        pathname.startsWith(p)
    );

    // ヘッダーを非表示にする場合
    if (isExactHide || isPrefixHide) {
        return <>{children}</>;
    }

    // 通常ページはヘッダーを表示
    return (
        <>
            <Header />
            <div className="pt-16">
                {children}
            </div>
        </>
    );
}