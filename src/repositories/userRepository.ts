import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * ユーザー情報とプロフィール情報をまとめた型定義。
 * 関数findUserWithProfileByUIDにて使用
 * 各プロパティはデータベースの user_info テーブルおよび user_profile テーブルのカラムに対応。
 * null 可能なフィールドは、プロフィールが未登録の場合に null となる可能性がある。
 */
interface UserWithProfileRow extends RowDataPacket {
    user_id: number;
    display_name: string;
    gender: number;
    age: number;
    residence: string | null;
    occupation: string | null;
    message: string | null;
    twitter: string | null;
    instagram: string | null;
}

export class UserRepository {

    /**
     * FirebaseのUIDを使って、user_info テーブルからユーザー情報を1件取得する。
     *
     * @param uid - FirebaseのユーザーID（uid）
     * @returns ユーザー情報のオブジェクト。存在しない場合は null を返す。
     */
    static async findUserByUID(uid: string): Promise<any | null> {
        const [rows] = await db.execute(
        'SELECT * FROM user_info WHERE u_id = ? LIMIT 1',
        [uid]
        );
        return (rows as any[])[0] ?? null;
    }

    /**
     * ユーザーID（u_id）を使って、ユーザー情報とプロフィールを結合して取得する。
     *
     * @param u_id - FirebaseのユーザーID
     * @returns ユーザーとプロフィールの情報。存在しなければnullを返す。
     */
        static async findUserWithProfileByUID(u_id: string): Promise<UserWithProfileRow | null> {
        const [rows] = await db.query<UserWithProfileRow[]>(
        `
        SELECT
            u.user_id,
            u.authority,
            p.display_name,
            p.gender,
            p.age,
            p.residence,
            p.occupation,
            p.message,
            p.is_profile_completed
        FROM user_info u
        LEFT JOIN user_profile p ON u.user_id = p.user_id
        WHERE u.u_id = ?
        `,
        [u_id]
        );

        return rows[0] ?? null;
    }

    static async findProfileByUserId(userId: string) {
        const [rows] = await db.execute(
          'SELECT * FROM user_profile WHERE user_id = ? LIMIT 1',
          [userId]
        );
        return (rows as any[])[0] ?? null;
    }

    /**
     * 指定したユーザーIDのプロフィール情報を更新する。
     * @param user_id - 更新対象のユーザーのID
     * @param profile - 更新するプロフィール情報のオブジェクト
     */
    static async updateProfile(user_id: number, profile: {
        display_name: string;
        age: number;
        residence: string;
        occupation: string;
        message: string;
        updated_by: string;
    }) : Promise<boolean> {
        try {
            const query = `
            UPDATE user_profile
            SET
                display_name = ?,
                age = ?,
                residence = ?,
                occupation = ?,
                message = ?,
                updated_at = NOW(),
                updated_by = ?
            WHERE user_id = ?
            `;
            const values = [
            profile.display_name,
            profile.age,
            profile.residence,
            profile.occupation,
            profile.message,
            profile.updated_by,
            user_id,
            ];
            await db.execute(query, values);
            return true;
        } catch (error) {
            return false;
        }
    }
}