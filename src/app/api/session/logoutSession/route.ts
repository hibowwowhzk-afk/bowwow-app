import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    const cookieStore = cookies();

    (cookieStore as any).set('session', '', {
        httpOnly: true,
        path: '/',
        expires: new Date(0),
    });

    return NextResponse.json({ message: 'logged out' });
}