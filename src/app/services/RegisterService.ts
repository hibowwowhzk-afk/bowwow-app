import db from "@/lib/db";
import { UserRepository } from "@/repositories/UserRepository";
import { UserActivityRepository } from "@/repositories/UserActivityRepository";
import { EmailVerificationRepository } from "@/repositories/EmailVerificationRepository";
import { AuthEmailSender } from "@/app/services/AuthEmailSender";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export class RegisterService {
    async register(email: string, password: string) {
        const conn = await db.getConnection();

        await conn.beginTransaction();

        try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanPassword = password.trim();

            // 重複チェック
            const userInfo = await UserRepository.findByEmail(conn, cleanEmail);

            // 認証済み
            if (userInfo?.is_email_verified === 1) {
                const err: any = new Error("登録済みのメールアドレスです");
                err.status = 409;
                throw err;
            }

            // 未認証ユーザー
            if (userInfo?.is_email_verified === 0) {
                const latestMail = await EmailVerificationRepository.findLatestByUid(conn, userInfo.u_id);

                if (latestMail?.last_sent_at) {
                    const lastSent = new Date(latestMail.last_sent_at).getTime();

                    if (Date.now() - lastSent < 60_000) {
                        const err: any = new Error(
                            "このメールアドレスには認証メールが送信されています。\nしばらくしてから再度お試しください。"
                        );
                        err.status = 429;
                        throw err;
                    }
                }

                await conn.commit();

                await AuthEmailSender.sendVerification({
                    conn,
                    uid: userInfo.u_id,
                    email: cleanEmail,
                });

                return {
                    status: "PENDING_VERIFICATION",
                };
            }

            // Firebase作成
            const userCred = await createUserWithEmailAndPassword(
                auth,
                cleanEmail,
                cleanPassword
            );

            const uid = userCred.user.uid;

            // DBユーザー作成
            const userId = await UserRepository.createUser(conn, uid, cleanEmail);

            // アクティビティ作成
            await UserActivityRepository.createUser(conn, userId);

            await conn.commit();

            // 認証メール送信
            await AuthEmailSender.sendVerification({
                conn,
                uid,
                email: cleanEmail,
            });

            return {
                status: "REGISTERED",
            };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}