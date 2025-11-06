"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const react = require("react");
const designSystem = require("@strapi/design-system");
const pad2 = (n) => String(n).padStart(2, "0");
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const YEARS_BACK_DEFAULT = 80;
const YEAR_RX = /^\d{4}$/;
const YM_RX = /^\d{4}-(0[1-9]|1[0-2])$/;
const YMD_RX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const detectPrecision = (v) => {
  if (!v) return "month";
  if (YEAR_RX.test(v)) return "year";
  if (YM_RX.test(v)) return "month";
  if (YMD_RX.test(v)) return "date";
  return "month";
};
const splitRange = (v) => {
  if (!v) return { isRange: false, left: "", right: "" };
  const idx = v.indexOf("..");
  if (idx === -1) return { isRange: false, left: v, right: "" };
  return { isRange: true, left: v.slice(0, idx), right: v.slice(idx + 2) };
};
const parseParts = (v) => {
  if (!v) return { y: NaN, m: NaN, d: NaN };
  const parts = v.split("-").map(Number);
  if (parts.length === 1) return { y: parts[0], m: NaN, d: NaN };
  if (parts.length === 2) return { y: parts[0], m: parts[1], d: NaN };
  return { y: parts[0], m: parts[1], d: parts[2] };
};
const toSinglePrec = (prec, y, m, d) => {
  if (!y || Number.isNaN(y)) return "";
  if (prec === "year") return String(y);
  if (prec === "month") {
    if (!m || Number.isNaN(m)) return "";
    return `${y}-${pad2(m)}`;
  }
  if (!m || Number.isNaN(m) || !d || Number.isNaN(d)) return "";
  return `${y}-${pad2(m)}-${pad2(d)}`;
};
const toRangePrec = (prec, sy, sm, sd, ey, em, ed) => {
  const left = toSinglePrec(prec, sy, sm, sd);
  const right = toSinglePrec(prec, ey, em, ed);
  if (!left || !right) return "";
  const [a, b] = left <= right ? [left, right] : [right, left];
  return `${a}..${b}`;
};
const MonthYearInput = react.forwardRef((props, ref) => {
  const { attribute, disabled, name, onChange, required, value, error } = props;
  const opt = attribute?.options || {};
  const allowedPrecisions = opt.allowedPrecisions || ["year", "month", "date"];
  const defaultPrecision = opt.defaultPrecision && allowedPrecisions.includes(opt.defaultPrecision) ? opt.defaultPrecision : "month";
  const allowRange = Boolean(opt.allowRange);
  const uiRequired = Boolean(opt.uiRequired);
  const isRequired = Boolean(required || uiRequired);
  const now = /* @__PURE__ */ new Date();
  const currentYear = now.getFullYear();
  const yMaxReq = Number.isFinite(opt.maxYear) ? opt.maxYear : currentYear;
  const yMax = Math.min(currentYear, yMaxReq);
  let yMin = Number.isFinite(opt.minYear) ? opt.minYear : currentYear - YEARS_BACK_DEFAULT;
  if (yMin > yMax) yMin = yMax - YEARS_BACK_DEFAULT;
  const typeForOnChange = attribute?.type || "string";
  const { isRange, left, right } = splitRange(value ?? void 0);
  const rangeActive = allowRange && isRange;
  const initialSingleSource = rangeActive ? left : value || "";
  const initialPrecision = detectPrecision(initialSingleSource || "") || defaultPrecision;
  const [mode, setMode] = react.useState(rangeActive ? "range" : "single");
  const [precision, setPrecision] = react.useState(initialPrecision);
  const s = parseParts(initialSingleSource);
  const [y, setY] = react.useState(Number.isNaN(s.y) ? "" : s.y);
  const [m, setM] = react.useState(Number.isNaN(s.m) ? "" : s.m);
  const [d, setD] = react.useState(Number.isNaN(s.d) ? "" : s.d);
  const l = parseParts(rangeActive ? left : "");
  const r = parseParts(rangeActive ? right : "");
  const [sy, setSY] = react.useState(Number.isNaN(l.y) ? "" : l.y);
  const [sm, setSM] = react.useState(Number.isNaN(l.m) ? "" : l.m);
  const [sd, setSD] = react.useState(Number.isNaN(l.d) ? "" : l.d);
  const [ey, setEY] = react.useState(Number.isNaN(r.y) ? "" : r.y);
  const [em, setEM] = react.useState(Number.isNaN(r.m) ? "" : r.m);
  const [ed, setED] = react.useState(Number.isNaN(r.d) ? "" : r.d);
  react.useEffect(() => {
    const spl = splitRange(value ?? void 0);
    const rangeOn = allowRange && spl.isRange;
    setMode(rangeOn ? "range" : "single");
    const src = rangeOn ? spl.left : value || "";
    const p = detectPrecision(src) || defaultPrecision;
    setPrecision(p);
    const s2 = parseParts(src);
    setY(Number.isNaN(s2.y) ? "" : s2.y);
    setM(Number.isNaN(s2.m) ? "" : s2.m);
    setD(Number.isNaN(s2.d) ? "" : s2.d);
    const l2 = parseParts(rangeOn ? spl.left : "");
    const r2 = parseParts(rangeOn ? spl.right : "");
    setSY(Number.isNaN(l2.y) ? "" : l2.y);
    setSM(Number.isNaN(l2.m) ? "" : l2.m);
    setSD(Number.isNaN(l2.d) ? "" : l2.d);
    setEY(Number.isNaN(r2.y) ? "" : r2.y);
    setEM(Number.isNaN(r2.m) ? "" : r2.m);
    setED(Number.isNaN(r2.d) ? "" : r2.d);
  }, [value, allowRange]);
  const years = react.useMemo(() => {
    const arr = [];
    for (let yy = yMax; yy >= yMin; yy--) arr.push(yy);
    return arr;
  }, [yMin, yMax]);
  const months = react.useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const isAllowed = (p) => allowedPrecisions.includes(p);
  const commitSingle = (Y, M, D, precOverride) => {
    const prec = precOverride ?? precision;
    const val = toSinglePrec(prec, Y, M, D);
    onChange({ target: { name, type: typeForOnChange, value: val } });
  };
  const commitRange = (SY, SM, SD, EY, EM, ED, precOverride) => {
    const prec = precOverride ?? precision;
    const val = toRangePrec(prec, SY, SM, SD, EY, EM, ED);
    onChange({ target: { name, type: typeForOnChange, value: val } });
  };
  const setModeAndCoerce = (next) => {
    setMode(next);
    if (next === "single") {
      const Y = typeof y === "number" ? clamp(y, yMin, yMax) : currentYear;
      if (precision === "year") return commitSingle(Y, void 0, void 0, precision);
      if (precision === "month") {
        const M = typeof m === "number" ? clamp(m, 1, 12) : 1;
        return commitSingle(Y, M, void 0, precision);
      }
      const base = /* @__PURE__ */ new Date();
      const M2 = typeof m === "number" ? clamp(m, 1, 12) : base.getMonth() + 1;
      const days = new Date(Y, M2, 0).getDate();
      const D2 = typeof d === "number" ? clamp(d, 1, days) : Math.min(base.getDate(), days);
      commitSingle(Y, M2, D2, precision);
    } else {
      const SY2 = typeof sy === "number" ? clamp(sy, yMin, yMax) : currentYear;
      const EY2 = typeof ey === "number" ? clamp(ey, yMin, yMax) : currentYear;
      if (precision === "year") return commitRange(SY2, void 0, void 0, EY2, void 0, void 0, precision);
      if (precision === "month") {
        const SM2 = typeof sm === "number" ? clamp(sm, 1, 12) : 1;
        const EM2 = typeof em === "number" ? clamp(em, 1, 12) : 1;
        return commitRange(SY2, SM2, void 0, EY2, EM2, void 0, precision);
      }
      const base = /* @__PURE__ */ new Date();
      const SM3 = typeof sm === "number" ? clamp(sm, 1, 12) : base.getMonth() + 1;
      const EM3 = typeof em === "number" ? clamp(em, 1, 12) : SM3;
      const SdMax = new Date(SY2, SM3, 0).getDate();
      const EdMax = new Date(EY2, EM3, 0).getDate();
      const SD2 = typeof sd === "number" ? clamp(sd, 1, SdMax) : 1;
      const ED2 = typeof ed === "number" ? clamp(ed, 1, EdMax) : SD2;
      commitRange(SY2, SM3, SD2, EY2, EM3, ED2, precision);
    }
  };
  const setPrecisionAndCoerce = (p) => {
    if (!isAllowed(p)) return;
    setPrecision(p);
    if (mode === "single") {
      const Y = typeof y === "number" ? clamp(y, yMin, yMax) : currentYear;
      if (p === "year") return commitSingle(Y, void 0, void 0, p);
      if (p === "month") {
        const M = typeof m === "number" ? clamp(m, 1, 12) : 1;
        return commitSingle(Y, M, void 0, p);
      }
      const base = /* @__PURE__ */ new Date();
      const M2 = typeof m === "number" ? clamp(m, 1, 12) : base.getMonth() + 1;
      const days = new Date(Y, M2, 0).getDate();
      const D2 = typeof d === "number" ? clamp(d, 1, days) : Math.min(base.getDate(), days);
      commitSingle(Y, M2, D2, p);
    } else {
      const SY2 = typeof sy === "number" ? clamp(sy, yMin, yMax) : currentYear;
      const EY2 = typeof ey === "number" ? clamp(ey, yMin, yMax) : currentYear;
      if (p === "year") return commitRange(SY2, void 0, void 0, EY2, void 0, void 0, p);
      if (p === "month") {
        const SM2 = typeof sm === "number" ? clamp(sm, 1, 12) : 1;
        const EM2 = typeof em === "number" ? clamp(em, 1, 12) : 1;
        return commitRange(SY2, SM2, void 0, EY2, EM2, void 0, p);
      }
      const base = /* @__PURE__ */ new Date();
      const SM3 = typeof sm === "number" ? clamp(sm, 1, 12) : base.getMonth() + 1;
      const EM3 = typeof em === "number" ? clamp(em, 1, 12) : SM3;
      const SdMax = new Date(SY2, SM3, 0).getDate();
      const EdMax = new Date(EY2, EM3, 0).getDate();
      const SD2 = typeof sd === "number" ? clamp(sd, 1, SdMax) : 1;
      const ED2 = typeof ed === "number" ? clamp(ed, 1, EdMax) : SD2;
      commitRange(SY2, SM3, SD2, EY2, EM3, ED2, p);
    }
  };
  const handleYearChange = (val) => {
    const Ynum = Number(val);
    const nextY = Number.isNaN(Ynum) ? void 0 : Ynum;
    setY(Number.isNaN(Ynum) ? "" : Ynum);
    if (mode === "single") {
      if (precision === "year") commitSingle(nextY);
      else if (precision === "month") commitSingle(nextY, typeof m === "number" ? m : void 0);
      else commitSingle(nextY, typeof m === "number" ? m : void 0, typeof d === "number" ? d : void 0);
    } else {
      setSY(Number.isNaN(Ynum) ? "" : Ynum);
      commitRange(
        nextY,
        typeof sm === "number" ? sm : void 0,
        typeof sd === "number" ? sd : void 0,
        typeof ey === "number" ? ey : void 0,
        typeof em === "number" ? em : void 0,
        typeof ed === "number" ? ed : void 0
      );
    }
  };
  const handleMonthChange = (val) => {
    const Mnum = Number(val);
    const nextM = Number.isNaN(Mnum) ? void 0 : Mnum;
    setM(Number.isNaN(Mnum) ? "" : Mnum);
    if (mode === "single") {
      if (precision === "month") commitSingle(typeof y === "number" ? y : void 0, nextM);
      else commitSingle(typeof y === "number" ? y : void 0, nextM, typeof d === "number" ? d : void 0);
    } else {
      setSM(Number.isNaN(Mnum) ? "" : Mnum);
      commitRange(
        typeof sy === "number" ? sy : void 0,
        nextM,
        typeof sd === "number" ? sd : void 0,
        typeof ey === "number" ? ey : void 0,
        typeof em === "number" ? em : void 0,
        typeof ed === "number" ? ed : void 0
      );
    }
  };
  const handleDateChangeSingle = (date) => {
    if (!date) return onChange({ target: { name, type: typeForOnChange, value: "" } });
    commitSingle(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };
  const handleDateChangeStart = (date) => {
    if (!date) return onChange({ target: { name, type: typeForOnChange, value: "" } });
    const yy = date.getFullYear(), mm = date.getMonth() + 1, dd = date.getDate();
    commitRange(
      yy,
      mm,
      dd,
      typeof ey === "number" ? ey : yy,
      typeof em === "number" ? em : mm,
      typeof ed === "number" ? ed : dd
    );
  };
  const handleDateChangeEnd = (date) => {
    if (!date) return onChange({ target: { name, type: typeForOnChange, value: "" } });
    const yy = date.getFullYear(), mm = date.getMonth() + 1, dd = date.getDate();
    commitRange(
      typeof sy === "number" ? sy : yy,
      typeof sm === "number" ? sm : mm,
      typeof sd === "number" ? sd : dd,
      yy,
      mm,
      dd
    );
  };
  const singleDate = typeof y === "number" && typeof m === "number" && typeof d === "number" ? new Date(y, m - 1, d) : null;
  const startDate = typeof sy === "number" && typeof sm === "number" && typeof sd === "number" ? new Date(sy, sm - 1, sd) : null;
  const endDate = typeof ey === "number" && typeof em === "number" && typeof ed === "number" ? new Date(ey, em - 1, ed) : null;
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Root, { name, id: name, error, required: isRequired, hint: opt.hint, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { ref, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { direction: "column", alignItems: "stretch", gap: 3, children: [
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Label, { children: [
      name,
      isRequired ? " *" : ""
    ] }),
    allowRange && /* @__PURE__ */ jsxRuntime.jsx(
      designSystem.Radio.Group,
      {
        name: `${name}-mode`,
        value: mode,
        onValueChange: (v) => setModeAndCoerce(v),
        "aria-label": "Mode",
        children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 4, wrap: "wrap", children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "single", children: "Single" }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "range", children: "Range" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      designSystem.Radio.Group,
      {
        name: `${name}-precision`,
        value: precision,
        onValueChange: (v) => setPrecisionAndCoerce(v),
        "aria-label": "Precision",
        children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 4, wrap: "wrap", children: [
          allowedPrecisions.includes("year") && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "year", children: "Year" }),
          allowedPrecisions.includes("month") && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "month", children: "Month & Year" }),
          allowedPrecisions.includes("date") && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "date", children: "Full date" })
        ] })
      }
    ),
    mode === "single" && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      precision === "year" && /* @__PURE__ */ jsxRuntime.jsx(
        designSystem.SingleSelect,
        {
          id: `${name}-year`,
          label: "Year",
          required: isRequired,
          disabled,
          placeholder: "Year",
          value: typeof y === "number" ? String(y) : void 0,
          onChange: handleYearChange,
          children: years.map((yy) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(yy), children: yy }, yy))
        }
      ),
      precision === "month" && /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 2, wrap: "wrap", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.SingleSelect,
          {
            id: `${name}-month`,
            label: "Month",
            required: isRequired,
            disabled,
            placeholder: "Month",
            value: typeof m === "number" ? String(m) : void 0,
            onChange: handleMonthChange,
            children: months.map((mm) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(mm), children: pad2(mm) }, mm))
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.SingleSelect,
          {
            id: `${name}-year`,
            label: "Year",
            required: isRequired,
            disabled,
            placeholder: "Year",
            value: typeof y === "number" ? String(y) : void 0,
            onChange: handleYearChange,
            children: years.map((yy) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(yy), children: yy }, yy))
          }
        )
      ] }),
      precision === "date" && /* @__PURE__ */ jsxRuntime.jsx(
        designSystem.DatePicker,
        {
          id: `${name}-date`,
          label: "Date",
          value: singleDate ?? void 0,
          onChange: handleDateChangeSingle,
          disabled,
          required: isRequired,
          minDate: new Date(yMin, 0, 1),
          maxDate: new Date(yMax, 11, 31)
        }
      )
    ] }),
    mode === "range" && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      precision === "year" && /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 2, wrap: "wrap", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.SingleSelect,
          {
            id: `${name}-start-year`,
            label: "Start year",
            required: isRequired,
            disabled,
            placeholder: "Start",
            value: typeof sy === "number" ? String(sy) : void 0,
            onChange: (v) => {
              const Y = Number(v);
              setSY(Number.isNaN(Y) ? "" : Y);
              commitRange(
                Number.isNaN(Y) ? void 0 : Y,
                typeof sm === "number" ? sm : void 0,
                typeof sd === "number" ? sd : void 0,
                typeof ey === "number" ? ey : void 0,
                typeof em === "number" ? em : void 0,
                typeof ed === "number" ? ed : void 0
              );
            },
            children: years.map((yy) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(yy), children: yy }, yy))
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.SingleSelect,
          {
            id: `${name}-end-year`,
            label: "End year",
            required: isRequired,
            disabled,
            placeholder: "End",
            value: typeof ey === "number" ? String(ey) : void 0,
            onChange: (v) => {
              const Y = Number(v);
              setEY(Number.isNaN(Y) ? "" : Y);
              commitRange(
                typeof sy === "number" ? sy : void 0,
                typeof sm === "number" ? sm : void 0,
                typeof sd === "number" ? sd : void 0,
                Number.isNaN(Y) ? void 0 : Y,
                typeof em === "number" ? em : void 0,
                typeof ed === "number" ? ed : void 0
              );
            },
            children: years.map((yy) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(yy), children: yy }, yy))
          }
        )
      ] }),
      precision === "month" && /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { direction: "column", gap: 2, children: [
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 2, wrap: "wrap", children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            designSystem.SingleSelect,
            {
              id: `${name}-start-month`,
              label: "Start month",
              required: isRequired,
              disabled,
              placeholder: "MM",
              value: typeof sm === "number" ? String(sm) : void 0,
              onChange: (v) => {
                const M = Number(v);
                setSM(Number.isNaN(M) ? "" : M);
                commitRange(
                  typeof sy === "number" ? sy : void 0,
                  Number.isNaN(M) ? void 0 : M,
                  typeof sd === "number" ? sd : void 0,
                  typeof ey === "number" ? ey : void 0,
                  typeof em === "number" ? em : void 0,
                  typeof ed === "number" ? ed : void 0
                );
              },
              children: months.map((mm) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(mm), children: pad2(mm) }, mm))
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            designSystem.SingleSelect,
            {
              id: `${name}-start-year`,
              label: "Start year",
              required: isRequired,
              disabled,
              placeholder: "YYYY",
              value: typeof sy === "number" ? String(sy) : void 0,
              onChange: (v) => {
                const Y = Number(v);
                setSY(Number.isNaN(Y) ? "" : Y);
                commitRange(
                  Number.isNaN(Y) ? void 0 : Y,
                  typeof sm === "number" ? sm : void 0,
                  typeof sd === "number" ? sd : void 0,
                  typeof ey === "number" ? ey : void 0,
                  typeof em === "number" ? em : void 0,
                  typeof ed === "number" ? ed : void 0
                );
              },
              children: years.map((yy) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(yy), children: yy }, yy))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 2, wrap: "wrap", children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            designSystem.SingleSelect,
            {
              id: `${name}-end-month`,
              label: "End month",
              required: isRequired,
              disabled,
              placeholder: "MM",
              value: typeof em === "number" ? String(em) : void 0,
              onChange: (v) => {
                const M = Number(v);
                setEM(Number.isNaN(M) ? "" : M);
                commitRange(
                  typeof sy === "number" ? sy : void 0,
                  typeof sm === "number" ? sm : void 0,
                  typeof sd === "number" ? sd : void 0,
                  typeof ey === "number" ? ey : void 0,
                  Number.isNaN(M) ? void 0 : M,
                  typeof ed === "number" ? ed : void 0
                );
              },
              children: months.map((mm) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(mm), children: pad2(mm) }, mm))
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            designSystem.SingleSelect,
            {
              id: `${name}-end-year`,
              label: "End year",
              required: isRequired,
              disabled,
              placeholder: "YYYY",
              value: typeof ey === "number" ? String(ey) : void 0,
              onChange: (v) => {
                const Y = Number(v);
                setEY(Number.isNaN(Y) ? "" : Y);
                commitRange(
                  typeof sy === "number" ? sy : void 0,
                  typeof sm === "number" ? sm : void 0,
                  typeof sd === "number" ? sd : void 0,
                  Number.isNaN(Y) ? void 0 : Y,
                  typeof em === "number" ? em : void 0,
                  typeof ed === "number" ? ed : void 0
                );
              },
              children: years.map((yy) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: String(yy), children: yy }, yy))
            }
          )
        ] })
      ] }),
      precision === "date" && /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { gap: 2, wrap: "wrap", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.DatePicker,
          {
            id: `${name}-start-date`,
            label: "Start date",
            value: startDate ?? void 0,
            onChange: handleDateChangeStart,
            disabled,
            required: isRequired,
            minDate: new Date(yMin, 0, 1),
            maxDate: new Date(yMax, 11, 31)
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.DatePicker,
          {
            id: `${name}-end-date`,
            label: "End date",
            value: endDate ?? void 0,
            onChange: handleDateChangeEnd,
            disabled,
            required: isRequired,
            minDate: new Date(yMin, 0, 1),
            maxDate: new Date(yMax, 11, 31)
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Error, {}),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Hint, {})
  ] }) }) });
});
MonthYearInput.displayName = "MonthYearInput";
exports.default = MonthYearInput;
