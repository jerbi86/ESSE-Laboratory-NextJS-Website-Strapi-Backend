import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import {
    Field,                    // Field.Root / Field.Label / Field.Error / Field.Hint
    SingleSelect,
    SingleSelectOption,
    DatePicker,
    Radio,                    // Radio.Group / Radio.Item
    Flex,
    Box,
} from '@strapi/design-system';

type Precision = 'year' | 'month' | 'date';
type Mode = 'single' | 'range';

type Props = {
    attribute: {
        type?: string;
        options?: {
            minYear?: number;
            maxYear?: number;          // capped to current year
            defaultPrecision?: Precision;
            allowedPrecisions?: Precision[];
            hint?: string;
            allowRange?: boolean;      // setup toggle (shows Single/Range)
            uiRequired?: boolean;      // setup toggle (UI-only required)
        };
    };
    disabled?: boolean;
    error?: string;
    name: string;                  // field label
    onChange: (e: { target: { name: string; type: string; value: string } }) => void;
    required?: boolean;            // CT Builder “Required”
    value?: string;                // single: 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD' ; range: 'START..END'
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const YEARS_BACK_DEFAULT = 80;

const YEAR_RX = /^\d{4}$/;
const YM_RX = /^\d{4}-(0[1-9]|1[0-2])$/;
const YMD_RX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const detectPrecision = (v?: string): Precision => {
    if (!v) return 'month';
    if (YEAR_RX.test(v)) return 'year';
    if (YM_RX.test(v)) return 'month';
    if (YMD_RX.test(v)) return 'date';
    return 'month';
};

const splitRange = (v?: string) => {
    if (!v) return { isRange: false, left: '', right: '' };
    const idx = v.indexOf('..');
    if (idx === -1) return { isRange: false, left: v, right: '' };
    return { isRange: true, left: v.slice(0, idx), right: v.slice(idx + 2) };
};

const parseParts = (v?: string) => {
    if (!v) return { y: NaN, m: NaN, d: NaN };
    const parts = v.split('-').map(Number);
    if (parts.length === 1) return { y: parts[0], m: NaN, d: NaN };
    if (parts.length === 2) return { y: parts[0], m: parts[1], d: NaN };
    return { y: parts[0], m: parts[1], d: parts[2] };
};

const toSinglePrec = (prec: Precision, y?: number, m?: number, d?: number) => {
    if (!y || Number.isNaN(y)) return '';
    if (prec === 'year') return String(y);
    if (prec === 'month') {
        if (!m || Number.isNaN(m)) return '';
        return `${y}-${pad2(m)}`;
    }
    if (!m || Number.isNaN(m) || !d || Number.isNaN(d)) return '';
    return `${y}-${pad2(m)}-${pad2(d)}`;
};

const toRangePrec = (
    prec: Precision,
    sy?: number, sm?: number, sd?: number,
    ey?: number, em?: number, ed?: number
) => {
    const left = toSinglePrec(prec, sy, sm, sd);
    const right = toSinglePrec(prec, ey, em, ed);
    if (!left || !right) return '';
    const [a, b] = left <= right ? [left, right] : [right, left];
    return `${a}..${b}`;
};

const MonthYearInput = forwardRef<HTMLDivElement, Props>((props, ref) => {
    const { attribute, disabled, name, onChange, required, value, error } = props;

    // Options from setup
    const opt = attribute?.options || {};
    const allowedPrecisions: Precision[] = opt.allowedPrecisions || ['year', 'month', 'date'];
    const defaultPrecision: Precision =
        opt.defaultPrecision && allowedPrecisions.includes(opt.defaultPrecision)
            ? opt.defaultPrecision
            : 'month';

    const allowRange = Boolean(opt.allowRange);
    const uiRequired = Boolean(opt.uiRequired);
    const isRequired = Boolean(required || uiRequired);

    const now = new Date();
    const currentYear = now.getFullYear();

    // Year bounds (max capped to current year)
    const yMaxReq = Number.isFinite(opt.maxYear) ? (opt.maxYear as number) : currentYear;
    const yMax = Math.min(currentYear, yMaxReq);
    let yMin = Number.isFinite(opt.minYear) ? (opt.minYear as number) : currentYear - YEARS_BACK_DEFAULT;
    if (yMin > yMax) yMin = yMax - YEARS_BACK_DEFAULT;

    const typeForOnChange = attribute?.type || 'string';

    // Derive mode/precision from value
    const { isRange, left, right } = splitRange(value ?? undefined);
    const rangeActive = allowRange && isRange;

    const initialSingleSource = rangeActive ? left : (value || '');
    const initialPrecision = detectPrecision(initialSingleSource || '') || defaultPrecision;

    // Mode & precision
    const [mode, setMode] = useState<Mode>(rangeActive ? 'range' : 'single');
    const [precision, setPrecision] = useState<Precision>(initialPrecision);

    // SINGLE state
    const s = parseParts(initialSingleSource);
    const [y, setY] = useState<number | ''>(Number.isNaN(s.y) ? '' : s.y);
    const [m, setM] = useState<number | ''>(Number.isNaN(s.m) ? '' : s.m);
    const [d, setD] = useState<number | ''>(Number.isNaN(s.d) ? '' : s.d);

    // RANGE state
    const l = parseParts(rangeActive ? left : '');
    const r = parseParts(rangeActive ? right : '');
    const [sy, setSY] = useState<number | ''>(Number.isNaN(l.y) ? '' : l.y);
    const [sm, setSM] = useState<number | ''>(Number.isNaN(l.m) ? '' : l.m);
    const [sd, setSD] = useState<number | ''>(Number.isNaN(l.d) ? '' : l.d);
    const [ey, setEY] = useState<number | ''>(Number.isNaN(r.y) ? '' : r.y);
    const [em, setEM] = useState<number | ''>(Number.isNaN(r.m) ? '' : r.m);
    const [ed, setED] = useState<number | ''>(Number.isNaN(r.d) ? '' : r.d);

    // Keep state synced when editing an existing entry or after toggles change value
    useEffect(() => {
        const spl = splitRange(value ?? undefined);
        const rangeOn = allowRange && spl.isRange;
        setMode(rangeOn ? 'range' : 'single');

        const src = rangeOn ? spl.left : (value || '');
        const p = detectPrecision(src) || defaultPrecision;
        setPrecision(p);

        const s2 = parseParts(src);
        setY(Number.isNaN(s2.y) ? '' : s2.y);
        setM(Number.isNaN(s2.m) ? '' : s2.m);
        setD(Number.isNaN(s2.d) ? '' : s2.d);

        const l2 = parseParts(rangeOn ? spl.left : '');
        const r2 = parseParts(rangeOn ? spl.right : '');
        setSY(Number.isNaN(l2.y) ? '' : l2.y);
        setSM(Number.isNaN(l2.m) ? '' : l2.m);
        setSD(Number.isNaN(l2.d) ? '' : l2.d);
        setEY(Number.isNaN(r2.y) ? '' : r2.y);
        setEM(Number.isNaN(r2.m) ? '' : r2.m);
        setED(Number.isNaN(r2.d) ? '' : r2.d);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, allowRange]);

    // Options for selects
    const years = useMemo(() => {
        const arr: number[] = [];
        for (let yy = yMax; yy >= yMin; yy--) arr.push(yy);
        return arr;
    }, [yMin, yMax]);

    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

    const isAllowed = (p: Precision) => allowedPrecisions.includes(p);

    // Commit helpers (precOverride avoids double-click regressions)
    const commitSingle = (Y?: number, M?: number, D?: number, precOverride?: Precision) => {
        const prec = precOverride ?? precision;
        const val = toSinglePrec(prec, Y, M, D);
        onChange({ target: { name, type: typeForOnChange, value: val } });
    };

    const commitRange = (
        SY?: number, SM?: number, SD?: number,
        EY?: number, EM?: number, ED?: number,
        precOverride?: Precision
    ) => {
        const prec = precOverride ?? precision;
        const val = toRangePrec(prec, SY, SM, SD, EY, EM, ED);
        onChange({ target: { name, type: typeForOnChange, value: val } });
    };

    // Mode change → always commit a non-empty value immediately
    const setModeAndCoerce = (next: Mode) => {
        setMode(next);
        if (next === 'single') {
            const Y = typeof y === 'number' ? clamp(y, yMin, yMax) : currentYear;
            if (precision === 'year') return commitSingle(Y, undefined, undefined, precision);
            if (precision === 'month') {
                const M = typeof m === 'number' ? clamp(m, 1, 12) : 1;
                return commitSingle(Y, M, undefined, precision);
            }
            const base = new Date();
            const M2 = typeof m === 'number' ? clamp(m, 1, 12) : base.getMonth() + 1;
            const days = new Date(Y, M2, 0).getDate();
            const D2 = typeof d === 'number' ? clamp(d, 1, days) : Math.min(base.getDate(), days);
            commitSingle(Y, M2, D2, precision);
        } else {
            const SY2 = typeof sy === 'number' ? clamp(sy, yMin, yMax) : currentYear;
            const EY2 = typeof ey === 'number' ? clamp(ey, yMin, yMax) : currentYear;
            if (precision === 'year') return commitRange(SY2, undefined, undefined, EY2, undefined, undefined, precision);
            if (precision === 'month') {
                const SM2 = typeof sm === 'number' ? clamp(sm, 1, 12) : 1;
                const EM2 = typeof em === 'number' ? clamp(em, 1, 12) : 1;
                return commitRange(SY2, SM2, undefined, EY2, EM2, undefined, precision);
            }
            const base = new Date();
            const SM3 = typeof sm === 'number' ? clamp(sm, 1, 12) : base.getMonth() + 1;
            const EM3 = typeof em === 'number' ? clamp(em, 1, 12) : SM3;
            const SdMax = new Date(SY2, SM3, 0).getDate();
            const EdMax = new Date(EY2, EM3, 0).getDate();
            const SD2 = typeof sd === 'number' ? clamp(sd, 1, SdMax) : 1;
            const ED2 = typeof ed === 'number' ? clamp(ed, 1, EdMax) : SD2;
            commitRange(SY2, SM3, SD2, EY2, EM3, ED2, precision);
        }
    };

    // Precision change → commit with the new precision immediately (override!)
    const setPrecisionAndCoerce = (p: Precision) => {
        if (!isAllowed(p)) return;
        setPrecision(p);
        if (mode === 'single') {
            const Y = typeof y === 'number' ? clamp(y, yMin, yMax) : currentYear;
            if (p === 'year') return commitSingle(Y, undefined, undefined, p);
            if (p === 'month') {
                const M = typeof m === 'number' ? clamp(m, 1, 12) : 1;
                return commitSingle(Y, M, undefined, p);
            }
            const base = new Date();
            const M2 = typeof m === 'number' ? clamp(m, 1, 12) : base.getMonth() + 1;
            const days = new Date(Y, M2, 0).getDate();
            const D2 = typeof d === 'number' ? clamp(d, 1, days) : Math.min(base.getDate(), days);
            commitSingle(Y, M2, D2, p);
        } else {
            const SY2 = typeof sy === 'number' ? clamp(sy, yMin, yMax) : currentYear;
            const EY2 = typeof ey === 'number' ? clamp(ey, yMin, yMax) : currentYear;
            if (p === 'year') return commitRange(SY2, undefined, undefined, EY2, undefined, undefined, p);
            if (p === 'month') {
                const SM2 = typeof sm === 'number' ? clamp(sm, 1, 12) : 1;
                const EM2 = typeof em === 'number' ? clamp(em, 1, 12) : 1;
                return commitRange(SY2, SM2, undefined, EY2, EM2, undefined, p);
            }
            const base = new Date();
            const SM3 = typeof sm === 'number' ? clamp(sm, 1, 12) : base.getMonth() + 1;
            const EM3 = typeof em === 'number' ? clamp(em, 1, 12) : SM3;
            const SdMax = new Date(SY2, SM3, 0).getDate();
            const EdMax = new Date(EY2, EM3, 0).getDate();
            const SD2 = typeof sd === 'number' ? clamp(sd, 1, SdMax) : 1;
            const ED2 = typeof ed === 'number' ? clamp(ed, 1, EdMax) : SD2;
            commitRange(SY2, SM3, SD2, EY2, EM3, ED2, p);
        }
    };

    // Single-mode handlers
    const handleYearChange = (val: string | number) => {
        const Ynum = Number(val);
        const nextY = Number.isNaN(Ynum) ? undefined : Ynum;
        setY(Number.isNaN(Ynum) ? '' : Ynum);
        if (mode === 'single') {
            if (precision === 'year') commitSingle(nextY);
            else if (precision === 'month') commitSingle(nextY, typeof m === 'number' ? m : undefined);
            else commitSingle(nextY, typeof m === 'number' ? m : undefined, typeof d === 'number' ? d : undefined);
        } else {
            setSY(Number.isNaN(Ynum) ? '' : Ynum);
            commitRange(
                nextY,
                typeof sm === 'number' ? sm : undefined,
                typeof sd === 'number' ? sd : undefined,
                typeof ey === 'number' ? ey : undefined,
                typeof em === 'number' ? em : undefined,
                typeof ed === 'number' ? ed : undefined
            );
        }
    };

    const handleMonthChange = (val: string | number) => {
        const Mnum = Number(val);
        const nextM = Number.isNaN(Mnum) ? undefined : Mnum;
        setM(Number.isNaN(Mnum) ? '' : Mnum);
        if (mode === 'single') {
            if (precision === 'month') commitSingle(typeof y === 'number' ? y : undefined, nextM);
            else commitSingle(typeof y === 'number' ? y : undefined, nextM, typeof d === 'number' ? d : undefined);
        } else {
            setSM(Number.isNaN(Mnum) ? '' : Mnum);
            commitRange(
                typeof sy === 'number' ? sy : undefined,
                nextM,
                typeof sd === 'number' ? sd : undefined,
                typeof ey === 'number' ? ey : undefined,
                typeof em === 'number' ? em : undefined,
                typeof ed === 'number' ? ed : undefined
            );
        }
    };

    // Date handlers (DS DatePicker is controlled via `value`, not `selectedDate`)
    const handleDateChangeSingle = (date?: Date | null) => {
        if (!date) return onChange({ target: { name, type: typeForOnChange, value: '' } });
        commitSingle(date.getFullYear(), date.getMonth() + 1, date.getDate());
    };

    const handleDateChangeStart = (date?: Date | null) => {
        if (!date) return onChange({ target: { name, type: typeForOnChange, value: '' } });
        const yy = date.getFullYear(), mm = date.getMonth() + 1, dd = date.getDate();
        commitRange(
            yy, mm, dd,
            typeof ey === 'number' ? ey : yy,
            typeof em === 'number' ? em : mm,
            typeof ed === 'number' ? ed : dd
        );
    };

    const handleDateChangeEnd = (date?: Date | null) => {
        if (!date) return onChange({ target: { name, type: typeForOnChange, value: '' } });
        const yy = date.getFullYear(), mm = date.getMonth() + 1, dd = date.getDate();
        commitRange(
            typeof sy === 'number' ? sy : yy,
            typeof sm === 'number' ? sm : mm,
            typeof sd === 'number' ? sd : dd,
            yy, mm, dd
        );
    };

    // Derived Date objects for DatePicker
    const singleDate =
        typeof y === 'number' && typeof m === 'number' && typeof d === 'number'
            ? new Date(y, m - 1, d)
            : null;

    const startDate =
        typeof sy === 'number' && typeof sm === 'number' && typeof sd === 'number'
            ? new Date(sy, sm - 1, sd)
            : null;

    const endDate =
        typeof ey === 'number' && typeof em === 'number' && typeof ed === 'number'
            ? new Date(ey, em - 1, ed)
            : null;

    return (
        <Field.Root name={name} id={name} error={error} required={isRequired} hint={opt.hint}>
            <Box ref={ref}>
                <Flex direction="column" alignItems="stretch" gap={3}>
                    <Field.Label>
                        {name}{isRequired ? ' *' : ''}
                    </Field.Label>

                    {/* Mode (only if enabled in setup) */}
                    {allowRange && (
                        <Radio.Group
                            name={`${name}-mode`}
                            value={mode}
                            onValueChange={(v: string) => setModeAndCoerce(v as Mode)}
                            aria-label="Mode"
                        >
                            <Flex gap={4} wrap="wrap">
                                <Radio.Item value="single">Single</Radio.Item>
                                <Radio.Item value="range">Range</Radio.Item>
                            </Flex>
                        </Radio.Group>
                    )}

                    {/* Precision */}
                    <Radio.Group
                        name={`${name}-precision`}
                        value={precision}
                        onValueChange={(v: string) => setPrecisionAndCoerce(v as Precision)}
                        aria-label="Precision"
                    >
                        <Flex gap={4} wrap="wrap">
                            {allowedPrecisions.includes('year') && <Radio.Item value="year">Year</Radio.Item>}
                            {allowedPrecisions.includes('month') && <Radio.Item value="month">Month &amp; Year</Radio.Item>}
                            {allowedPrecisions.includes('date') && <Radio.Item value="date">Full date</Radio.Item>}
                        </Flex>
                    </Radio.Group>

                    {/* Inputs */}
                    {mode === 'single' && (
                        <>
                            {precision === 'year' && (
                                <SingleSelect
                                    id={`${name}-year`}
                                    label="Year"
                                    required={isRequired}
                                    disabled={disabled}
                                    placeholder="Year"
                                    value={typeof y === 'number' ? String(y) : undefined}
                                    onChange={handleYearChange}
                                >
                                    {years.map((yy) => (
                                        <SingleSelectOption key={yy} value={String(yy)}>{yy}</SingleSelectOption>
                                    ))}
                                </SingleSelect>
                            )}

                            {precision === 'month' && (
                                <Flex gap={2} wrap="wrap">
                                    <SingleSelect
                                        id={`${name}-month`}
                                        label="Month"
                                        required={isRequired}
                                        disabled={disabled}
                                        placeholder="Month"
                                        value={typeof m === 'number' ? String(m) : undefined}
                                        onChange={handleMonthChange}
                                    >
                                        {months.map((mm) => (
                                            <SingleSelectOption key={mm} value={String(mm)}>{pad2(mm)}</SingleSelectOption>
                                        ))}
                                    </SingleSelect>

                                    <SingleSelect
                                        id={`${name}-year`}
                                        label="Year"
                                        required={isRequired}
                                        disabled={disabled}
                                        placeholder="Year"
                                        value={typeof y === 'number' ? String(y) : undefined}
                                        onChange={handleYearChange}
                                    >
                                        {years.map((yy) => (
                                            <SingleSelectOption key={yy} value={String(yy)}>{yy}</SingleSelectOption>
                                        ))}
                                    </SingleSelect>
                                </Flex>
                            )}

                            {precision === 'date' && (
                                <DatePicker
                                    id={`${name}-date`}
                                    label="Date"
                                    value={singleDate ?? undefined}          // IMPORTANT: controlled via `value`
                                    onChange={handleDateChangeSingle}
                                    disabled={disabled}
                                    required={isRequired}
                                    minDate={new Date(yMin, 0, 1)}
                                    maxDate={new Date(yMax, 11, 31)}
                                />
                            )}
                        </>
                    )}

                    {mode === 'range' && (
                        <>
                            {precision === 'year' && (
                                <Flex gap={2} wrap="wrap">
                                    <SingleSelect
                                        id={`${name}-start-year`}
                                        label="Start year"
                                        required={isRequired}
                                        disabled={disabled}
                                        placeholder="Start"
                                        value={typeof sy === 'number' ? String(sy) : undefined}
                                        onChange={(v) => {
                                            const Y = Number(v);
                                            setSY(Number.isNaN(Y) ? '' : Y);
                                            commitRange(
                                                Number.isNaN(Y) ? undefined : Y,
                                                typeof sm === 'number' ? sm : undefined,
                                                typeof sd === 'number' ? sd : undefined,
                                                typeof ey === 'number' ? ey : undefined,
                                                typeof em === 'number' ? em : undefined,
                                                typeof ed === 'number' ? ed : undefined
                                            );
                                        }}
                                    >
                                        {years.map((yy) => <SingleSelectOption key={yy} value={String(yy)}>{yy}</SingleSelectOption>)}
                                    </SingleSelect>

                                    <SingleSelect
                                        id={`${name}-end-year`}
                                        label="End year"
                                        required={isRequired}
                                        disabled={disabled}
                                        placeholder="End"
                                        value={typeof ey === 'number' ? String(ey) : undefined}
                                        onChange={(v) => {
                                            const Y = Number(v);
                                            setEY(Number.isNaN(Y) ? '' : Y);
                                            commitRange(
                                                typeof sy === 'number' ? sy : undefined,
                                                typeof sm === 'number' ? sm : undefined,
                                                typeof sd === 'number' ? sd : undefined,
                                                Number.isNaN(Y) ? undefined : Y,
                                                typeof em === 'number' ? em : undefined,
                                                typeof ed === 'number' ? ed : undefined
                                            );
                                        }}
                                    >
                                        {years.map((yy) => <SingleSelectOption key={yy} value={String(yy)}>{yy}</SingleSelectOption>)}
                                    </SingleSelect>
                                </Flex>
                            )}

                            {precision === 'month' && (
                                <Flex direction="column" gap={2}>
                                    <Flex gap={2} wrap="wrap">
                                        <SingleSelect
                                            id={`${name}-start-month`}
                                            label="Start month"
                                            required={isRequired}
                                            disabled={disabled}
                                            placeholder="MM"
                                            value={typeof sm === 'number' ? String(sm) : undefined}
                                            onChange={(v) => {
                                                const M = Number(v);
                                                setSM(Number.isNaN(M) ? '' : M);
                                                commitRange(
                                                    typeof sy === 'number' ? sy : undefined,
                                                    Number.isNaN(M) ? undefined : M,
                                                    typeof sd === 'number' ? sd : undefined,
                                                    typeof ey === 'number' ? ey : undefined,
                                                    typeof em === 'number' ? em : undefined,
                                                    typeof ed === 'number' ? ed : undefined
                                                );
                                            }}
                                        >
                                            {months.map((mm) => <SingleSelectOption key={mm} value={String(mm)}>{pad2(mm)}</SingleSelectOption>)}
                                        </SingleSelect>

                                        <SingleSelect
                                            id={`${name}-start-year`}
                                            label="Start year"
                                            required={isRequired}
                                            disabled={disabled}
                                            placeholder="YYYY"
                                            value={typeof sy === 'number' ? String(sy) : undefined}
                                            onChange={(v) => {
                                                const Y = Number(v);
                                                setSY(Number.isNaN(Y) ? '' : Y);
                                                commitRange(
                                                    Number.isNaN(Y) ? undefined : Y,
                                                    typeof sm === 'number' ? sm : undefined,
                                                    typeof sd === 'number' ? sd : undefined,
                                                    typeof ey === 'number' ? ey : undefined,
                                                    typeof em === 'number' ? em : undefined,
                                                    typeof ed === 'number' ? ed : undefined
                                                );
                                            }}
                                        >
                                            {years.map((yy) => <SingleSelectOption key={yy} value={String(yy)}>{yy}</SingleSelectOption>)}
                                        </SingleSelect>
                                    </Flex>

                                    <Flex gap={2} wrap="wrap">
                                        <SingleSelect
                                            id={`${name}-end-month`}
                                            label="End month"
                                            required={isRequired}
                                            disabled={disabled}
                                            placeholder="MM"
                                            value={typeof em === 'number' ? String(em) : undefined}
                                            onChange={(v) => {
                                                const M = Number(v);
                                                setEM(Number.isNaN(M) ? '' : M);
                                                commitRange(
                                                    typeof sy === 'number' ? sy : undefined,
                                                    typeof sm === 'number' ? sm : undefined,
                                                    typeof sd === 'number' ? sd : undefined,
                                                    typeof ey === 'number' ? ey : undefined,
                                                    Number.isNaN(M) ? undefined : M,
                                                    typeof ed === 'number' ? ed : undefined
                                                );
                                            }}
                                        >
                                            {months.map((mm) => <SingleSelectOption key={mm} value={String(mm)}>{pad2(mm)}</SingleSelectOption>)}
                                        </SingleSelect>

                                        <SingleSelect
                                            id={`${name}-end-year`}
                                            label="End year"
                                            required={isRequired}
                                            disabled={disabled}
                                            placeholder="YYYY"
                                            value={typeof ey === 'number' ? String(ey) : undefined}
                                            onChange={(v) => {
                                                const Y = Number(v);
                                                setEY(Number.isNaN(Y) ? '' : Y);
                                                commitRange(
                                                    typeof sy === 'number' ? sy : undefined,
                                                    typeof sm === 'number' ? sm : undefined,
                                                    typeof sd === 'number' ? sd : undefined,
                                                    Number.isNaN(Y) ? undefined : Y,
                                                    typeof em === 'number' ? em : undefined,
                                                    typeof ed === 'number' ? ed : undefined
                                                );
                                            }}
                                        >
                                            {years.map((yy) => <SingleSelectOption key={yy} value={String(yy)}>{yy}</SingleSelectOption>)}
                                        </SingleSelect>
                                    </Flex>
                                </Flex>
                            )}

                            {precision === 'date' && (
                                <Flex gap={2} wrap="wrap">
                                    <DatePicker
                                        id={`${name}-start-date`}
                                        label="Start date"
                                        value={startDate ?? undefined}    // IMPORTANT: use `value`
                                        onChange={handleDateChangeStart}
                                        disabled={disabled}
                                        required={isRequired}
                                        minDate={new Date(yMin, 0, 1)}
                                        maxDate={new Date(yMax, 11, 31)}
                                    />
                                    <DatePicker
                                        id={`${name}-end-date`}
                                        label="End date"
                                        value={endDate ?? undefined}      // IMPORTANT: use `value`
                                        onChange={handleDateChangeEnd}
                                        disabled={disabled}
                                        required={isRequired}
                                        minDate={new Date(yMin, 0, 1)}
                                        maxDate={new Date(yMax, 11, 31)}
                                    />
                                </Flex>
                            )}
                        </>
                    )}

                    <Field.Error />
                    <Field.Hint />
                </Flex>
            </Box>
        </Field.Root>
    );
});

MonthYearInput.displayName = 'MonthYearInput';
export default MonthYearInput;
