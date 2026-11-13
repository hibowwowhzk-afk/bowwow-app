import { Suspense } from 'react';
import ResetPasswordContent from './ResetPasswordContent';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="p-6">読み込み中...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}