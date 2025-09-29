// app/components/HeaderGuard.tsx
'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'  // 現在のパスを取得
import HeaderWrapper from '@/app/components/HeaderWrapper'  // HeaderWrapperをインポート
import BottomNav from '@/app/components/ui/BottomNav'  // BottomNavをインポート

export default function HeaderGuard({ children }: { children: ReactNode }) {
    const pathname = usePathname()  // 現在のパスを取得

    // '/auth/*' のページだけで HeaderWrapper と BottomNav を表示
    const shouldShowHeaderAndNav = pathname.startsWith('/auth/')

    if (!shouldShowHeaderAndNav) {
        return <>{children}</>  // '/auth/*' 以外のページでは HeaderWrapper と BottomNav なしで表示
    }

    return (
        <div>
        {/* '/auth/*' のページでは HeaderWrapper と BottomNav を表示 */}
        <HeaderWrapper>{children}</HeaderWrapper>
        <BottomNav />
        </div>
    )
}