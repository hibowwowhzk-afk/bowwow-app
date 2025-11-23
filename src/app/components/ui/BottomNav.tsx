// app/components/ui/BottomNav.tsx
'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
    const pathname = usePathname()

    const getNavHref = (path: string) => {
        // 'auth' プレフィックスを適用するかどうかを決定
        return pathname.startsWith('/auth/') ? `/auth${path}` : path
    }

    return (
        <nav className="fixed bottom-0 w-full flex justify-around bg-white shadow-inner border-t py-2 z-50">
            <NavItem href={getNavHref("/home")} label="ホーム" active={pathname === '/home'} />
            <NavItem href={getNavHref("/matchings")} label="マッチング" active={pathname === '/matchings'} />
            <NavItem href={getNavHref("/requests")} label="リクエスト" active={pathname === '/requests'} />
            <NavItem href={getNavHref("/register/profile")} label="プロフィール" active={pathname === '/profile'} />
        </nav>
    )
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link href={href} className={`text-sm ${active ? 'text-blue-500 font-bold' : 'text-gray-600'}`}>
            {label}
        </Link>
    )
}