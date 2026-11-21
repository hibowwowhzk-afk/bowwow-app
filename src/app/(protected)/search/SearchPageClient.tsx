
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Search,
    RotateCcw,
    CalendarDays,
    Cake,
    Zap,
    Plus,
    X,
    Tag,
} from 'lucide-react';

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
    const [keywordOrList, setKeywordOrList] = useState<string[]>(
        initialKeywordOrList.length > 0 ? initialKeywordOrList : ['']
    );

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

        setAgeError('');
        setDateError('');
        setKeywordMustError('');
        setKeywordOrErrors([]);

        let hasError = false;

        const ageFromNum = ageFrom ? Number(ageFrom) : undefined;
        const ageToNum = ageTo ? Number(ageTo) : undefined;

        if (ageFrom && isNaN(ageFromNum!)) {
            setAgeError('年齢（から）が不正です');
            hasError = true;
        } else if (ageTo && isNaN(ageToNum!)) {
            setAgeError('年齢（まで）が不正です');
            hasError = true;
        } else if (
            ageFromNum !== undefined &&
            ageToNum !== undefined &&
            ageFromNum > ageToNum
        ) {
            setAgeError('年齢の範囲が不正です');
            hasError = true;
        }

        const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

        if (isImmediate && (dateFrom || dateTo)) {
            setDateError('「今すぐ」が選択されている場合、日付は指定できません');
            hasError = true;
        } else if (!isImmediate) {
            if (dateFrom && !DATE_REGEX.test(dateFrom)) {
                setDateError('日付（から）が不正です');
                hasError = true;
            } else if (dateTo && !DATE_REGEX.test(dateTo)) {
                setDateError('日付（まで）が不正です');
                hasError = true;
            } else if (
                dateFrom &&
                dateTo &&
                DATE_REGEX.test(dateFrom) &&
                DATE_REGEX.test(dateTo) &&
                dateFrom > dateTo
            ) {
                setDateError('日付の範囲が不正です');
                hasError = true;
            }
        }

        if (keywordMust.length > 50) {
            setKeywordMustError('必須キーワードは50文字以内です');
            hasError = true;
        }

        const orErrors = keywordOrList.map((kw, idx) => {
            if (kw.length > 30) {
                hasError = true;
                return `サブキーワード${idx + 1}は30文字以内です`;
            }
            return '';
        });

        setKeywordOrErrors(orErrors);

        if (hasError) return;

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
        setKeywordOrErrors(errorsCopy);
    };

    const inputClass =
        'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

    const labelClass = 'mb-2 block text-sm font-semibold text-slate-700';

    const errorClass = 'mt-2 text-xs font-medium text-red-500';

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
            <div className="mx-auto w-full max-w-lg">

                {/* タイトル */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2 text-blue-600">
                        <Search className="h-5 w-5" />
                        <span className="text-xs font-bold tracking-wider">
                            SEARCH
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        投稿を検索
                    </h1>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        条件を指定して、参加したい募集を探しましょう。
                    </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">

                    {/* 年齢 */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Cake className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    年齢
                                </h2>
                                <p className="text-xs text-slate-400">
                                    参加者の年齢を指定
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <label className={labelClass}>下限</label>
                                <select
                                    value={ageFrom}
                                    onChange={(e) => setAgeFrom(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">指定なし</option>
                                    {Array.from({ length: 81 }, (_, i) => i + 20).map(age => (
                                        <option key={age} value={String(age)}>
                                            {age}歳
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <span className="mt-7 text-sm text-slate-400">〜</span>

                            <div className="min-w-0 flex-1">
                                <label className={labelClass}>上限</label>
                                <select
                                    value={ageTo}
                                    onChange={(e) => setAgeTo(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">指定なし</option>
                                    {Array.from({ length: 81 }, (_, i) => i + 20).map(age => (
                                        <option key={age} value={String(age)}>
                                            {age}歳
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {ageError && <p className={errorClass}>{ageError}</p>}
                    </div>

                    {/* 開催日時 */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    開催日
                                </h2>
                                <p className="text-xs text-slate-400">
                                    希望する開催日を指定
                                </p>
                            </div>
                        </div>

                        <label
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                                isImmediate
                                    ? 'border-blue-200 bg-blue-50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={isImmediate}
                                onChange={(e) => setIsImmediate(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600">
                                <Zap className="h-5 w-5" />
                            </div>

                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                    今すぐ参加できる募集
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    直近で開催したい募集を探す
                                </p>
                            </div>
                        </label>

                        <div className={`mt-4 grid grid-cols-2 gap-3 transition-opacity ${isImmediate ? 'opacity-40' : ''}`}>
                            <div>
                                <label className={labelClass}>開始日</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    disabled={isImmediate}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>終了日</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    disabled={isImmediate}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`}
                                />
                            </div>
                        </div>

                        {dateError && <p className={errorClass}>{dateError}</p>}
                    </div>

                    {/* キーワード */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Tag className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    キーワード
                                </h2>
                                <p className="text-xs text-slate-400">
                                    募集メッセージから検索
                                </p>
                            </div>
                        </div>

                        {/* 必須キーワード */}
                        <div>
                            <label className={labelClass}>
                                必ず含むキーワード
                            </label>
                            <input
                                type="text"
                                value={keywordMust}
                                onChange={(e) => setKeywordMust(e.target.value)}
                                maxLength={50}
                                className={inputClass}
                                placeholder="例：天神、飲み会"
                            />
                            <div className="mt-1 flex items-center justify-between">
                                {keywordMustError ? (
                                    <p className="text-xs font-medium text-red-500">
                                        {keywordMustError}
                                    </p>
                                ) : (
                                    <span />
                                )}
                                <span className="text-xs text-slate-400">
                                    {keywordMust.length}/50
                                </span>
                            </div>
                        </div>

                        {/* ORキーワード */}
                        <div className="mt-5 border-t border-slate-100 pt-5">
                            <div className="mb-3">
                                <label className="text-sm font-semibold text-slate-700">
                                    いずれかを含むキーワード
                                </label>
                                <p className="mt-1 text-xs text-slate-400">
                                    入力したキーワードのどれかを含む募集を検索します
                                </p>
                            </div>

                            <div className="space-y-3">
                                {keywordOrList.map((kw, index) => (
                                    <div key={index}>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={kw}
                                                maxLength={30}
                                                onChange={(e) => updateKeyword(index, e.target.value)}
                                                className={inputClass}
                                                placeholder={`キーワード ${index + 1}`}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => removeKeyword(index)}
                                                aria-label={`キーワード${index + 1}を削除`}
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="mt-1 flex justify-between">
                                            {keywordOrErrors[index] ? (
                                                <p className="text-xs font-medium text-red-500">
                                                    {keywordOrErrors[index]}
                                                </p>
                                            ) : (
                                                <span />
                                            )}
                                            <span className="text-xs text-slate-400">
                                                {kw.length}/30
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addKeyword}
                                disabled={keywordOrList.length >= 3}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Plus className="h-4 w-4" />
                                キーワードを追加
                                <span className="text-xs font-normal text-blue-400">
                                    ({keywordOrList.length}/3)
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* ボタン */}
                    <div className="space-y-3 pt-2">
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99]"
                        >
                            <Search className="h-4 w-4" />
                            この条件で検索
                        </button>

                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        >
                            <RotateCcw className="h-4 w-4" />
                            条件をクリア
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
