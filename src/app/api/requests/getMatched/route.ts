// src/app/api/requests/getMatched/route.ts

import { NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchesRepository, MatchedUser } from '@/repositories/MatchesRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET() {
  try {
    const authResult = await verifySessionFromRequest();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const uid = authResult.uid;

    const user = await UserRepository.findUserWithProfileByUID(uid);
    if (!user) {
      throw new Error('ユーザー情報が見つかりません');
    }

    const matchedRequestsList: MatchedUser[] = await MatchesRepository.getMatchedUsersByUserId(user.user_id);

    return NextResponse.json({ matchedRequestsList });
  } catch (error) {
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}