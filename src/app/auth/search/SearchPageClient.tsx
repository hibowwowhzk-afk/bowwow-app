'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SearchPageClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialAgeFrom = searchParams.get('ageFrom') ?? '';
    const initialAgeTo = searchParams.get('ageTo') ?? '';
    const initialDateFrom = searchParams.get('dateFrom') ?? '';
    const initialDateTo = searchParams.get('dateTo') ?? '';
    const initialKeyword1 = searchParams.get('keyword1') ?? '';
    const initialKeyword2 = searchParams.get('keyword2') ?? '';
    const initialKeyword3 = searchParams.get('keyword3') ?? '';
    const initialImmediate = searchParams.get('immediate') === 'true';

    const [ageFrom, setAgeFrom] = useState(initialAgeFrom);
    const [ageTo, setAgeTo] = useState(initialAgeTo);
    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [keyword1, setKeyword1] = useState(initialKeyword1);
    const [keyword2, setKeyword2] = useState(initialKeyword2);
    const [keyword3, setKeyword3] = useState(initialKeyword3);
    const [isImmediate, setIsImmediate] = useState(initialImmediate);

    useEffect(() => {
        if (dateFrom || dateTo) setIsImmediate(false);
    }, [dateFrom, dateTo]);

    useEffect(() => {
        if (isImmediate) {
            setDateFrom('');
            setDateTo('');
        }
    }, [isImmediate]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();

        if (ageFrom) params.set('ageFrom', ageFrom);
        if (ageTo) params.set('ageTo', ageTo);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (keyword1) params.set('keyword1', keyword1);
        if (keyword2) params.set('keyword2', keyword2);
        if (keyword3) params.set('keyword3', keyword3);
        if (isImmediate) params.set('immediate', 'true');

        router.push(`/auth/search/results?${params.toString()}`);
    };

    const handleClear = () => {
        setAgeFrom('');
        setAgeTo('');
        setDateFrom('');
        setDateTo('');
        setKeyword1('');
        setKeyword2('');
        setKeyword3('');
        setIsImmediate(false);
    };

    const isDateDisabled = isImmediate;
    const isImmediateDisabled = !!(dateFrom || dateTo);

    return (
        <section className="flex flex-col items-center p-6">
            <h1 className="w-full max-w-md text-left text-2xl font-bold mb-4">投稿検索</h1>

            <form onSubmit={handleSearch} className="w-full max-w-md space-y-6">
                {/* 年齢 */}
                <div className="flex gap-6">
                    <div className="flex flex-col flex-1 text-left">
                        <label htmlFor="ageFrom" className="mb-1 font-semibold">年齢（から）</label>
                        <select
                            id="ageFrom"
                            value={ageFrom}
                            onChange={(e) => setAgeFrom(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        >
                            <option value="">指定なし</option>
                            {Array.from({ length: 81 }, (_, i) => i + 20).map((age) => (
                                <option key={age} value={age.toString()}>{age}歳</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col flex-1 text-left">
                        <label htmlFor="ageTo" className="mb-1 font-semibold">年齢（まで）</label>
                        <select
                            id="ageTo"
                            value={ageTo}
                            onChange={(e) => setAgeTo(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        >
                            <option value="">指定なし</option>
                            {Array.from({ length: 81 }, (_, i) => i + 20).map((age) => (
                                <option key={age} value={age.toString()}>{age}歳</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 今すぐ */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="immediate"
                        checked={isImmediate}
                        onChange={(e) => setIsImmediate(e.target.checked)}
                        disabled={isImmediateDisabled}
                        className="w-4 h-4"
                    />
                    <label
                        htmlFor="immediate"
                        className={`font-semibold ${isImmediateDisabled ? 'text-gray-400 cursor-not-allowed' : ''}`}
                        title={isImmediateDisabled ? '日付が選択されているため選べません' : ''}
                    >
                        今すぐ
                    </label>
                </div>

                {/* 日付 */}
                <div className="flex gap-6">
                    <div className="flex flex-col flex-1 text-left">
                        <label htmlFor="dateFrom" className="mb-1 font-semibold">日付（から）</label>
                        <input
                            type="date"
                            id="dateFrom"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            disabled={isDateDisabled}
                            className={`border rounded px-3 py-2 w-full ${isDateDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                            title={isDateDisabled ? '「今すぐ」が選ばれているため入力できません' : ''}
                        />
                    </div>

                    <div className="flex flex-col flex-1 text-left">
                        <label htmlFor="dateTo" className="mb-1 font-semibold">日付（まで）</label>
                        <input
                            type="date"
                            id="dateTo"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            disabled={isDateDisabled}
                            className={`border rounded px-3 py-2 w-full ${isDateDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                            title={isDateDisabled ? '「今すぐ」が選ばれているため入力できません' : ''}
                        />
                    </div>
                </div>

                {/* キーワード3つ */}
                <div className="flex flex-col text-left space-y-4">
                    <label className="font-semibold">投稿メッセージのキーワード</label>
                    <p className="text-sm text-gray-600">入力されたすべてのキーワードを含む投稿メッセージを表示します。</p>
                    <input type="text" value={keyword1} onChange={(e) => setKeyword1(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="例：場所" />
                    <input type="text" value={keyword2} onChange={(e) => setKeyword2(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="例：人数" />
                    <input type="text" value={keyword3} onChange={(e) => setKeyword3(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="例：職業" />
                </div>

                {/* ボタン */}
                <div className="flex gap-4">
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">検索</button>
                    <button type="button" onClick={handleClear} className="flex-1 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition">入力クリア</button>
                </div>
            </form>
        </section>
    );
}
