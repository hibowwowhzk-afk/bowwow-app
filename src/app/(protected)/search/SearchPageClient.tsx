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
    const initialImmediate = searchParams.get('immediate') === 'true';
    const initialKeywordMust = searchParams.get('keywordMust') ?? '';
    const initialKeywordOrList = searchParams.getAll('keywordOr');

    const [ageFrom, setAgeFrom] = useState(initialAgeFrom);
    const [ageTo, setAgeTo] = useState(initialAgeTo);
    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [isImmediate, setIsImmediate] = useState(initialImmediate);
    const [keywordMust, setKeywordMust] = useState(initialKeywordMust);
    const [keywordOrList, setKeywordOrList] = useState<string[]>(initialKeywordOrList.length > 0 ? initialKeywordOrList : ['']);

    // 各フィールド用のエラー
    const [ageError, setAgeError] = useState('');
    const [dateError, setDateError] = useState('');
    const [keywordMustError, setKeywordMustError] = useState('');
    const [keywordOrErrors, setKeywordOrErrors] = useState<string[]>([]);

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

        // --- リセット ---
        setAgeError('');
        setDateError('');
        setKeywordMustError('');
        setKeywordOrErrors([]);

        let hasError = false;

        // --- 年齢チェック ---
        const ageFromNum = ageFrom ? Number(ageFrom) : undefined;
        const ageToNum = ageTo ? Number(ageTo) : undefined;
        if (ageFrom && isNaN(ageFromNum!)) { setAgeError('年齢（から）が不正です'); hasError = true; }
        else if (ageTo && isNaN(ageToNum!)) { setAgeError('年齢（まで）が不正です'); hasError = true; }
        else if (ageFromNum !== undefined && ageToNum !== undefined && ageFromNum > ageToNum) { setAgeError('年齢の範囲が不正です'); hasError = true; }

        // --- 日付チェック ---
        const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
        if (isImmediate && (dateFrom || dateTo)) { setDateError('「今すぐ」が選択されている場合、日付は指定できません'); hasError = true; }
        else if (!isImmediate) {
            if (dateFrom && !DATE_REGEX.test(dateFrom)) { setDateError('日付（から）が不正です'); hasError = true; }
            else if (dateTo && !DATE_REGEX.test(dateTo)) { setDateError('日付（まで）が不正です'); hasError = true; }
            else if (dateFrom && dateTo && DATE_REGEX.test(dateFrom) && DATE_REGEX.test(dateTo) && dateFrom > dateTo) { setDateError('日付の範囲が不正です'); hasError = true; }
        }

        // --- キーワードチェック ---
        if (keywordMust.length > 50) { setKeywordMustError('必須キーワードは50文字以内です'); hasError = true; }

        const orErrors: string[] = keywordOrList.map((kw, idx) => {
            if (kw.length > 30) { hasError = true; return `サブキーワード${idx + 1}は30文字以内です`; }
            return '';
        });
        setKeywordOrErrors(orErrors);

        if (hasError) return;

        // --- URL作成 ---
        const must = keywordMust.trim();
        const orList = keywordOrList.map(v => v.trim()).filter(v => v.length > 0);

        const params = new URLSearchParams();
        if (ageFrom) params.set('ageFrom', ageFrom);
        if (ageTo) params.set('ageTo', ageTo);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (isImmediate) params.set('immediate', 'true');
        if (must) params.set('keywordMust', must);
        orList.forEach(kw => params.append('keywordOr', kw));

        router.push(`/search/results?${params.toString()}`);
    };

    const handleClear = () => {
        setAgeFrom('');
        setAgeTo('');
        setDateFrom('');
        setDateTo('');
        setIsImmediate(false);
        setKeywordMust('');
        setKeywordOrList(['']);
        setAgeError('');
        setDateError('');
        setKeywordMustError('');
        setKeywordOrErrors([]);
    };

    const addKeyword = () => {
        if (keywordOrList.length >= 3) return;
        setKeywordOrList([...keywordOrList, '']);
        setKeywordOrErrors([...keywordOrErrors, '']);
    };

    const updateKeyword = (index: number, value: string) => {
        const copy = [...keywordOrList];
        copy[index] = value;
        setKeywordOrList(copy);
    };

    const removeKeyword = (index: number) => {
        const copy = keywordOrList.filter((_, i) => i !== index);
        setKeywordOrList(copy.length > 0 ? copy : ['']);

        const errorsCopy = keywordOrErrors.filter((_, i) => i !== index);
        setKeywordOrErrors(errorsCopy.length > 0 ? errorsCopy : ['']);
    };

    return (
        <section className="flex flex-col items-center p-6">
            <h1 className="w-full max-w-md text-left text-2xl font-bold mb-4">投稿検索</h1>

            <form onSubmit={handleSearch} className="w-full max-w-md space-y-6">

                {/* 年齢 */}
                <div className="flex gap-6">
                    <div className="flex flex-col flex-1 text-left">
                        <label className="mb-1 font-semibold">年齢（から）</label>
                        <select
                            value={ageFrom}
                            onChange={(e) => setAgeFrom(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        >
                            <option value="">指定なし</option>
                            {Array.from({ length: 81 }, (_, i) => i + 20).map(age => (
                                <option key={age} value={String(age)}>{age}歳</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col flex-1 text-left">
                        <label className="mb-1 font-semibold">年齢（まで）</label>
                        <select
                            value={ageTo}
                            onChange={(e) => setAgeTo(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        >
                            <option value="">指定なし</option>
                            {Array.from({ length: 81 }, (_, i) => i + 20).map(age => (
                                <option key={age} value={String(age)}>{age}歳</option>
                            ))}
                        </select>
                    </div>
                </div>
                {ageError && <p className="text-red-600 text-sm">{ageError}</p>}

                {/* 今すぐ */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="immediate"
                        checked={isImmediate}
                        onChange={(e) => setIsImmediate(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label htmlFor="immediate" className="font-semibold">今すぐ</label>
                </div>

                {/* 日付 */}
                <div className="flex gap-6">
                    <div className="flex flex-col flex-1 text-left">
                        <label className="mb-1 font-semibold">日付（から）</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div className="flex flex-col flex-1 text-left">
                        <label className="mb-1 font-semibold">日付（まで）</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        />
                    </div>
                </div>
                {dateError && <p className="text-red-600 text-sm">{dateError}</p>}

                {/* 必須キーワード */}
                <div className="flex flex-col text-left space-y-1">
                    <label className="font-semibold">キーワード（必ず含む）</label>
                    <input
                        type="text"
                        value={keywordMust}
                        onChange={(e) => setKeywordMust(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="例：渋谷"
                    />
                    {keywordMustError && <p className="text-red-600 text-sm">{keywordMustError}</p>}
                </div>

                {/* ORキーワード */}
                <div className="flex flex-col text-left space-y-2">
                    <label className="font-semibold">キーワード（いずれか含む）</label>
                    {keywordOrList.map((kw, index) => (
                        <div key={index} className="flex flex-col gap-1">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={kw}
                                    onChange={(e) => updateKeyword(index, e.target.value)}
                                    className="border rounded px-3 py-2 w-full"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeKeyword(index)}
                                    className="px-3 bg-red-500 text-white rounded"
                                >×</button>
                            </div>
                            {keywordOrErrors[index] && <p className="text-red-600 text-sm">{keywordOrErrors[index]}</p>}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addKeyword}
                        disabled={keywordOrList.length >= 3}
                        className="px-3 py-2 rounded bg-gray-200 disabled:opacity-50"
                    >
                        ＋ キーワードを追加
                    </button>
                </div>

                {/* ボタン */}
                <div className="flex gap-4">
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded">検索</button>
                    <button type="button" onClick={handleClear} className="flex-1 py-3 bg-gray-300 text-gray-800 rounded">入力クリア</button>
                </div>
            </form>
        </section>
    );
}