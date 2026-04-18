// app/components/HeaderGuard.tsx
'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import HeaderWrapper from '@/app/components/HeaderWrapper'

export default function HeaderGuard({ children }: { children: ReactNode }) {
    const pathname = usePathname()

    // 除外したいパス
    const hideHeaderPaths = [
        '/auth/register/profile/first'
    ]

    const isHidden = hideHeaderPaths.some(path =>
        pathname.startsWith(path)
    )

    const shouldShowHeaderAndNav =
        pathname.startsWith('/auth/') && !isHidden

    if (!shouldShowHeaderAndNav) {
        return <>{children}</>
    }

    return (
        <div>
            <HeaderWrapper>{children}</HeaderWrapper>
        </div>
    )
}
