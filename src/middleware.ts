// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
    '/dashboard'
    ];

    export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        const token = req.cookies.get('session');
        if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    return NextResponse.next();
    }

    // matcher は **静的にハードコード** する必要がある
    export const config = {
    matcher: [
        '/dashboard/:path*'
    ],
};