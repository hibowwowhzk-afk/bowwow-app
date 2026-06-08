import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { PoolConnection } from "mysql2/promise";

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

export type UserRow = RowDataPacket & {
    user_id: number;
    u_id: string; // Firebase UID
    email: string;
    is_email_verified: number;
};

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

    /**
     * 指定したユーザーIDのプロフィール情報と画像URLを取得する
     * @param userId - ユーザーID
     * @returns UserProfile 型オブジェクト（画像URLを含む）、存在しなければ null
     */
    static async getProfileById(userId: number): Promise<{
        user_id: number;
        display_name: string;
        age: number;
        residence: string | null;
        occupation: string | null;
        message: string | null;
        image_url: string | null;
    } | null> {
        // プロフィール取得
        const [profileRows] = await db.execute(
            'SELECT user_id, display_name, age, residence, occupation, message FROM user_profile WHERE user_id = ? LIMIT 1',
            [userId]
        );
        const profile = (profileRows as any[])[0];
        if (!profile) return null;

        // プロフィール画像取得（優先順に1件）
        const [imageRows] = await db.execute(
            'SELECT image_url FROM user_profile_image WHERE user_id = ? ORDER BY `order` ASC LIMIT 1',
            [userId]
        );
        const image = (imageRows as any[])[0];

        return {
            ...profile,
            image_url: image?.image_url ?? null
        };
    }

    /**
     * 指定ユーザーのプロフィール画像を1件取得する
     * @param userId - ユーザーID
     * @returns 画像レコード or null
     */
    static async findProfileImageByUserId(
        userId: number
    ): Promise<{
        user_id: number;
        image_url: string;
        order: number;
    } | null> {
        const [rows] = await db.execute(
            `
            SELECT user_id, image_url, \`order\`
            FROM user_profile_image
            WHERE user_id = ?
            ORDER BY \`order\` ASC
            LIMIT 1
            `,
            [userId]
        );

        return (rows as any[])[0] ?? null;
    }

    /**
     * 指定ユーザーのプロフィール画像を全削除する
     * @param userId - ユーザーID
     */
    static async deleteProfileImage(userId: number): Promise<void> {
        await db.execute(
            'DELETE FROM user_profile_image WHERE user_id = ?',
            [userId]
        );
    }

    /**
     * プロフィール画像を新規登録する
     * @param image - 画像情報
     */
    static async addProfileImage(image: {
        user_id: number;
        image_url: string;
        order: number;
    }): Promise<void> {
        await db.execute(
            `
            INSERT INTO user_profile_image
                (user_id, image_url, \`order\`, created_at)
            VALUES
                (?, ?, ?, NOW())
            `,
            [
                image.user_id,
                image.image_url,
                image.order,
            ]
        );
    }

    /**
     * 指定したユーザーIDのプロフィール情報と画像URLを取得する
     * @param userId - ユーザーID
     * @returns プロフィール情報 + 画像URL（存在しなければ null）
     */
    static async findProfileWithImageByUserId(userId: number): Promise<{
        user_id: number;
        display_name: string;
        age: number;
        residence: string | null;
        occupation: string | null;
        message: string | null;
        image_url: string | null;
    } | null> {
        // プロフィール取得
        const [profileRows] = await db.execute(
            `
            SELECT
                user_id,
                display_name,
                age,
                residence,
                occupation,
                message
            FROM user_profile
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        const profile = (profileRows as any[])[0];
        if (!profile) return null;

        // プロフィール画像取得（優先度順で1件）
        const [imageRows] = await db.execute(
            `
            SELECT image_url
            FROM user_profile_image
            WHERE user_id = ?
            ORDER BY \`order\` ASC
            LIMIT 1
            `,
            [userId]
        );

        const image = (imageRows as any[])[0];

        return {
            ...profile,
            image_url: image?.image_url ?? null,
        };
    }

    /**
     * ユーザーを新規作成する
     * @param uid Firebase UID
     * @param email メールアドレス
     */
    static async createUser(conn: any, uid: string, email: string): Promise<number> {
        const [result] = await conn.execute(
            `
            INSERT INTO user_info (
                u_id,
                email,
                is_email_verified,
                authority,
                kyc_status,
                kyc_verified_at,
                is_banned,
                subscription_status,
                created_by,
                updated_by
            )
            VALUES (
                ?, ?, 0, 'user', 'none', NULL, 0, 'none', NULL, NULL
            )
            `,
            [uid, email]
        );

        return (result as any).insertId;
    }

    /**
     * プロフィールを新規作成する（初回登録）
     * @param profile - プロフィール情報
     */
    static async createProfile(profile: {
        user_id: number;
        display_name: string;
        gender: number;
        age: number;
        residence: string;
        occupation: string;
        message: string;
        created_by: string;
        updated_by: string;
    }): Promise<boolean> {
        try {
            const query = `
            INSERT INTO user_profile (
                user_id,
                display_name,
                gender,              -- ← 追加
                age,
                residence,
                occupation,
                message,
                is_profile_completed,
                created_at,
                created_by,
                updated_at,
                updated_by
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, 0, NOW(), ?, NOW(), ?
            )
            `;

            const values = [
                profile.user_id,
                profile.display_name,
                profile.gender,       // ← 追加
                profile.age,
                profile.residence,
                profile.occupation,
                profile.message,
                profile.created_by,
                profile.updated_by,
            ];

            await db.execute(query, values);
            return true;
        } catch (error) {
            console.error('[CREATE_PROFILE_ERROR]', error);
            return false;
        }
    }

    /**
     * プロフィール登録完了フラグを更新する
     * @param userId - ユーザーID
     * @param flag - 完了フラグ（0 or 1）
     */
    static async updateProfileCompleted(
        userId: number,
        flag: number
    ): Promise<boolean> {
        try {
            const query = `
            UPDATE user_profile
            SET
                is_profile_completed = ?,
                updated_at = NOW()
            WHERE user_id = ?
            `;

            await db.execute(query, [flag, userId]);
            return true;
        } catch (error) {
            console.error('[UPDATE_PROFILE_COMPLETED_ERROR]', error);
            return false;
        }
    }

    /**
     * メール認証済みに更新
     * @param conn Transaction Connection
     * @param uid Firebase UID
     */
    static async verifyEmail(
        conn: any,
        uid: string
    ): Promise<void> {
        await conn.execute(
            `
            UPDATE user_info
            SET
                is_email_verified = 1,
                updated_at = NOW()
            WHERE u_id = ?
            `,
            [uid]
        );
    }

    /**
     * メールからユーザー取得
     */
    static async findByEmail(
        conn: PoolConnection,
        email: string
    ): Promise<UserRow | null> {

        const [rows] = await conn.query<UserRow[]>(
            `
            SELECT
                user_id,
                u_id,
                email,
                is_email_verified
            FROM user_info
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        return rows[0] ?? null;
    }
}