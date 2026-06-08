// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const token = req.cookies.get('session');

    const publicPaths = [
        '/',
        '/login',
        '/register',
        '/verify-email',
        '/verify-email-sent',
        '/forgot-password',
        '/reset-password'
    ];

    const isPublic = publicPaths.includes(req.nextUrl.pathname);

    if (isPublic) {
        return NextResponse.next();
    }

    if (!token) {
        return NextResponse.redirect(
            new URL('/login', req.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next|favicon.ico).*)'],
};