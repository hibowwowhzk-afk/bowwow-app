// src/constants/ErrorMessages.ts

export const ErrorMessages = {
    // 共通
    UNAUTHORIZED: 'ログインしてください',
    KYC_REQUIRED: '本人確認が完了していません',
    USER_NOT_FOUND: 'ユーザー情報が見つかりません',
    INTERNAL_SERVER_ERROR: 'エラーが発生しました',

    // 投稿
    MESSAGE_REQUIRED: 'メッセージは必須です',
    MESSAGE_TOO_LONG: 'メッセージは200文字以内で入力してください',
    DATE_REQUIRED: '日付は必須です',
    PAST_DATE_NOT_ALLOWED: '過去の日付は選択できません',

    // 画像
    IMAGE_LIMIT_EXCEEDED: '画像は2枚まで選択できます',
    INVALID_IMAGE: '無効な画像ファイルです',
    EMPTY_IMAGE: '空の画像ファイルは使用できません',
    IMAGE_TOO_LARGE: '画像は5MB以内にしてください',
    INVALID_IMAGE_TYPE: 'JPEG・PNG・WebP形式の画像を選択してください',

    // 投稿制限
    FUTURE_POST_LIMIT: '未来の日付の投稿は3件までです',
    ALREADY_POSTED_TODAY: 'この日付にはすでに投稿しています',
} as const;

export type ErrorCode = keyof typeof ErrorMessages;