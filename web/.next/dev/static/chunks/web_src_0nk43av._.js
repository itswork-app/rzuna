(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/web/src/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/web/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/web/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://ooheonpmgjenriksxwgc.supabase.co");
const supabaseAnonKey = ("TURBOPACK compile-time value", "sb_publishable_nJ74f3Y56MLzwDoa5Zh3qA_tAzCDFMm");
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/web/src/hooks/useSignals.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "consumeQuota",
    ()=>consumeQuota,
    "useSignals",
    ()=>useSignals
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/web/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/lib/supabase.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function useSignals() {
    _s();
    const [signals, setSignals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSignals.useEffect": ()=>{
            // Initial fetch from backend API
            const fetchSignals = {
                "useSignals.useEffect.fetchSignals": async ()=>{
                    try {
                        const response = await fetch(`${("TURBOPACK compile-time value", "http://localhost:3000")}/signals`);
                        if (response.ok) {
                            const data = await response.json();
                            setSignals(data.signals || []);
                        }
                    } catch (err) {
                        console.error('Failed to fetch signals:', err);
                    } finally{
                        setLoading(false);
                    }
                }
            }["useSignals.useEffect.fetchSignals"];
            fetchSignals();
            // Supabase Real-time Subscription
            const channel = __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].channel('public:scouted_tokens').on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'scouted_tokens'
            }, {
                "useSignals.useEffect.channel": (payload)=>{
                    if (payload.eventType === 'UPDATE') {
                        const updatedToken = payload.new;
                        if (!updatedToken.is_active || updatedToken.base_score < 85) {
                            // AUTO-DOWN
                            setSignals({
                                "useSignals.useEffect.channel": (prev)=>prev.filter({
                                        "useSignals.useEffect.channel": (s)=>s.mint !== updatedToken.mint_address
                                    }["useSignals.useEffect.channel"])
                            }["useSignals.useEffect.channel"]);
                        } else {
                            setSignals({
                                "useSignals.useEffect.channel": (prev_0)=>prev_0.map({
                                        "useSignals.useEffect.channel": (s_0)=>s_0.mint === updatedToken.mint_address ? {
                                                ...s_0,
                                                score: updatedToken.base_score,
                                                aiReasoning: ({
                                                    "useSignals.useEffect.channel": ()=>{
                                                        if (!updatedToken.ai_reasoning) return s_0.aiReasoning;
                                                        try {
                                                            return JSON.parse(updatedToken.ai_reasoning);
                                                        } catch  {
                                                            return s_0.aiReasoning;
                                                        }
                                                    }
                                                })["useSignals.useEffect.channel"]()
                                            } : s_0
                                    }["useSignals.useEffect.channel"])
                            }["useSignals.useEffect.channel"]);
                        }
                    } else if (payload.eventType === 'INSERT') {
                        const newToken = payload.new;
                        if (newToken.is_active && newToken.base_score >= 85) {
                            const signal = {
                                mint: newToken.mint_address,
                                symbol: 'UNKNOWN',
                                score: newToken.base_score,
                                isPremium: true,
                                isNew: true,
                                timestamp: Date.now()
                            };
                            setSignals({
                                "useSignals.useEffect.channel": (prev_1)=>[
                                        ...prev_1,
                                        signal
                                    ]
                            }["useSignals.useEffect.channel"]);
                        }
                    }
                }
            }["useSignals.useEffect.channel"]).subscribe();
            return ({
                "useSignals.useEffect": ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].removeChannel(channel);
                }
            })["useSignals.useEffect"];
        }
    }["useSignals.useEffect"], []);
    return {
        signals,
        loading
    };
}
_s(useSignals, "QJseVvGPJdbW4+sL8eILKe+TbL8=");
async function consumeQuota(walletAddress) {
    try {
        const res = await fetch('/api/consume-quota', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet: walletAddress
            })
        });
        return res.ok;
    } catch  {
        return false;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/web/src/components/TokenCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TokenCard",
    ()=>TokenCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/zap.js [app-client] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/external-link.js [app-client] (ecmascript) <export default as ExternalLink>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cpu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Cpu$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/cpu.js [app-client] (ecmascript) <export default as Cpu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$hooks$2f$useSignals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/hooks/useSignals.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function TokenCard(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(97);
    if ($[0] !== "273608e3320184bfa3c220d953b7b508b6a66dde8816b700ce5e4d2558a8838c") {
        for(let $i = 0; $i < 97; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "273608e3320184bfa3c220d953b7b508b6a66dde8816b700ce5e4d2558a8838c";
    }
    const { signal, walletAddress } = t0;
    const isHighAlpha = signal.score >= 90;
    const [aiExpanded, setAiExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [quotaConsuming, setQuotaConsuming] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    let t1;
    if ($[1] !== aiExpanded || $[2] !== walletAddress) {
        t1 = ({
            "TokenCard[handleRevealAI]": async ()=>{
                if (aiExpanded) {
                    setAiExpanded(false);
                    return;
                }
                if (walletAddress) {
                    setQuotaConsuming(true);
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$hooks$2f$useSignals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["consumeQuota"])(walletAddress);
                    setQuotaConsuming(false);
                }
                setAiExpanded(true);
            }
        })["TokenCard[handleRevealAI]"];
        $[1] = aiExpanded;
        $[2] = walletAddress;
        $[3] = t1;
    } else {
        t1 = $[3];
    }
    const handleRevealAI = t1;
    let t2;
    let t3;
    let t4;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = {
            opacity: 0,
            y: 20
        };
        t3 = {
            opacity: 1,
            y: 0
        };
        t4 = {
            opacity: 0,
            scale: 0.95
        };
        $[4] = t2;
        $[5] = t3;
        $[6] = t4;
    } else {
        t2 = $[4];
        t3 = $[5];
        t4 = $[6];
    }
    let t5;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = {
            duration: 0.4,
            ease: [
                0.4,
                0,
                0.2,
                1
            ]
        };
        $[7] = t5;
    } else {
        t5 = $[7];
    }
    let t6;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = {
            padding: "20px",
            position: "relative",
            overflow: "hidden"
        };
        $[8] = t6;
    } else {
        t6 = $[8];
    }
    let t7;
    if ($[9] !== isHighAlpha) {
        t7 = isHighAlpha && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, transparent, var(--secondary), transparent)",
                boxShadow: "0 0 15px var(--secondary-glow)"
            }
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 99,
            columnNumber: 25
        }, this);
        $[9] = isHighAlpha;
        $[10] = t7;
    } else {
        t7 = $[10];
    }
    let t10;
    let t8;
    let t9;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px"
        };
        t9 = {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px"
        };
        t10 = {
            fontSize: "1.25rem",
            fontWeight: 700
        };
        $[11] = t10;
        $[12] = t8;
        $[13] = t9;
    } else {
        t10 = $[11];
        t8 = $[12];
        t9 = $[13];
    }
    let t11;
    if ($[14] !== signal.symbol) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
            style: t10,
            children: signal.symbol
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 143,
            columnNumber: 11
        }, this);
        $[14] = signal.symbol;
        $[15] = t11;
    } else {
        t11 = $[15];
    }
    let t12;
    if ($[16] !== signal.isNew) {
        t12 = signal.isNew && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "badge badge-secondary",
            children: "New"
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 151,
            columnNumber: 27
        }, this);
        $[16] = signal.isNew;
        $[17] = t12;
    } else {
        t12 = $[17];
    }
    let t13;
    if ($[18] !== signal.isPremium) {
        t13 = signal.isPremium && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "badge badge-primary",
            children: "Private"
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 159,
            columnNumber: 31
        }, this);
        $[18] = signal.isPremium;
        $[19] = t13;
    } else {
        t13 = $[19];
    }
    let t14;
    if ($[20] !== t11 || $[21] !== t12 || $[22] !== t13) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t9,
            children: [
                t11,
                t12,
                t13
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 167,
            columnNumber: 11
        }, this);
        $[20] = t11;
        $[21] = t12;
        $[22] = t13;
        $[23] = t14;
    } else {
        t14 = $[23];
    }
    let t15;
    if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = {
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            fontFamily: "Inter"
        };
        $[24] = t15;
    } else {
        t15 = $[24];
    }
    let t16;
    if ($[25] !== signal.mint) {
        t16 = signal.mint.slice(0, 4);
        $[25] = signal.mint;
        $[26] = t16;
    } else {
        t16 = $[26];
    }
    let t17;
    if ($[27] !== signal.mint) {
        t17 = signal.mint.slice(-4);
        $[27] = signal.mint;
        $[28] = t17;
    } else {
        t17 = $[28];
    }
    let t18;
    if ($[29] !== t16 || $[30] !== t17) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            style: t15,
            children: [
                t16,
                "...",
                t17
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 204,
            columnNumber: 11
        }, this);
        $[29] = t16;
        $[30] = t17;
        $[31] = t18;
    } else {
        t18 = $[31];
    }
    let t19;
    if ($[32] !== t14 || $[33] !== t18) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t14,
                t18
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 213,
            columnNumber: 11
        }, this);
        $[32] = t14;
        $[33] = t18;
        $[34] = t19;
    } else {
        t19 = $[34];
    }
    let t20;
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = {
            textAlign: "right"
        };
        $[35] = t20;
    } else {
        t20 = $[35];
    }
    let t21;
    if ($[36] === Symbol.for("react.memo_cache_sentinel")) {
        t21 = {
            fontSize: "1.5rem"
        };
        $[36] = t21;
    } else {
        t21 = $[36];
    }
    let t22;
    if ($[37] !== signal.score) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "stat-value",
            style: t21,
            children: signal.score
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 240,
            columnNumber: 11
        }, this);
        $[37] = signal.score;
        $[38] = t22;
    } else {
        t22 = $[38];
    }
    let t23;
    if ($[39] === Symbol.for("react.memo_cache_sentinel")) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            style: {
                fontSize: "0.625rem",
                color: "var(--text-muted)",
                fontWeight: 600
            },
            children: "ALPHA SCORE"
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 248,
            columnNumber: 11
        }, this);
        $[39] = t23;
    } else {
        t23 = $[39];
    }
    let t24;
    if ($[40] !== t22) {
        t24 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t20,
            children: [
                t22,
                t23
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 259,
            columnNumber: 11
        }, this);
        $[40] = t22;
        $[41] = t24;
    } else {
        t24 = $[41];
    }
    let t25;
    if ($[42] !== t19 || $[43] !== t24) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t8,
            children: [
                t19,
                t24
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 267,
            columnNumber: 11
        }, this);
        $[42] = t19;
        $[43] = t24;
        $[44] = t25;
    } else {
        t25 = $[44];
    }
    let t26;
    let t27;
    let t28;
    let t29;
    if ($[45] === Symbol.for("react.memo_cache_sentinel")) {
        t26 = {
            display: "flex",
            gap: "8px",
            marginBottom: "16px"
        };
        t27 = {
            flex: 1,
            padding: "12px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "12px",
            border: "1px solid var(--card-border)"
        };
        t28 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--secondary)",
                marginBottom: "8px"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
                    size: 14
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 297,
                    columnNumber: 8
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    style: {
                        fontSize: "0.75rem",
                        fontWeight: 600
                    },
                    children: "Catalysts"
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 297,
                    columnNumber: 25
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 291,
            columnNumber: 11
        }, this);
        t29 = {
            listStyle: "none",
            fontSize: "0.75rem",
            color: "#e2e8f0"
        };
        $[45] = t26;
        $[46] = t27;
        $[47] = t28;
        $[48] = t29;
    } else {
        t26 = $[45];
        t27 = $[46];
        t28 = $[47];
        t29 = $[48];
    }
    let t30;
    if ($[49] !== signal.reasoning?.catalysts) {
        t30 = (signal.reasoning?.catalysts || []).slice(0, 2).map(_TokenCardAnonymous);
        $[49] = signal.reasoning?.catalysts;
        $[50] = t30;
    } else {
        t30 = $[50];
    }
    let t31;
    if ($[51] !== t30) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t27,
            children: [
                t28,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    style: t29,
                    children: t30
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 326,
                    columnNumber: 33
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 326,
            columnNumber: 11
        }, this);
        $[51] = t30;
        $[52] = t31;
    } else {
        t31 = $[52];
    }
    let t32;
    let t33;
    let t34;
    if ($[53] === Symbol.for("react.memo_cache_sentinel")) {
        t32 = {
            flex: 1,
            padding: "12px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "12px",
            border: "1px solid var(--card-border)"
        };
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--accent)",
                marginBottom: "8px"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                    size: 14
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 349,
                    columnNumber: 8
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    style: {
                        fontSize: "0.75rem",
                        fontWeight: 600
                    },
                    children: "Risks"
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 349,
                    columnNumber: 35
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 343,
            columnNumber: 11
        }, this);
        t34 = {
            listStyle: "none",
            fontSize: "0.75rem",
            color: "#e2e8f0"
        };
        $[53] = t32;
        $[54] = t33;
        $[55] = t34;
    } else {
        t32 = $[53];
        t33 = $[54];
        t34 = $[55];
    }
    let t35;
    if ($[56] !== signal.reasoning?.riskFactors) {
        t35 = (signal.reasoning?.riskFactors || []).slice(0, 2).map(_TokenCardAnonymous2);
        $[56] = signal.reasoning?.riskFactors;
        $[57] = t35;
    } else {
        t35 = $[57];
    }
    let t36;
    if ($[58] !== t35) {
        t36 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t32,
            children: [
                t33,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    style: t34,
                    children: t35
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 376,
                    columnNumber: 33
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 376,
            columnNumber: 11
        }, this);
        $[58] = t35;
        $[59] = t36;
    } else {
        t36 = $[59];
    }
    let t37;
    if ($[60] !== t31 || $[61] !== t36) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t26,
            children: [
                t31,
                t36
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 384,
            columnNumber: 11
        }, this);
        $[60] = t31;
        $[61] = t36;
        $[62] = t37;
    } else {
        t37 = $[62];
    }
    let t38;
    if ($[63] === Symbol.for("react.memo_cache_sentinel")) {
        t38 = {
            marginBottom: "16px"
        };
        $[63] = t38;
    } else {
        t38 = $[63];
    }
    const t39 = `ai-reveal-${signal.mint}`;
    let t40;
    if ($[64] !== handleRevealAI) {
        t40 = ({
            "TokenCard[<button>.onClick]": ()=>void handleRevealAI()
        })["TokenCard[<button>.onClick]"];
        $[64] = handleRevealAI;
        $[65] = t40;
    } else {
        t40 = $[65];
    }
    const t41 = quotaConsuming ? "wait" : "pointer";
    let t42;
    if ($[66] !== t41) {
        t42 = {
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "rgba(124, 58, 237, 0.05)",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            borderRadius: "12px",
            cursor: t41,
            color: "#a78bfa",
            fontSize: "0.8125rem",
            fontWeight: 600,
            transition: "background 0.2s ease"
        };
        $[66] = t41;
        $[67] = t42;
    } else {
        t42 = $[67];
    }
    let t43;
    let t44;
    if ($[68] === Symbol.for("react.memo_cache_sentinel")) {
        t43 = {
            display: "flex",
            alignItems: "center",
            gap: "8px"
        };
        t44 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cpu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Cpu$3e$__["Cpu"], {
            size: 16,
            color: "var(--primary)"
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 442,
            columnNumber: 11
        }, this);
        $[68] = t43;
        $[69] = t44;
    } else {
        t43 = $[68];
        t44 = $[69];
    }
    const t45 = quotaConsuming ? "Consuming quota..." : "AI Reasoning Oracle";
    let t46;
    if ($[70] !== t45) {
        t46 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t43,
            children: [
                t44,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: t45
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 452,
                    columnNumber: 33
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 452,
            columnNumber: 11
        }, this);
        $[70] = t45;
        $[71] = t46;
    } else {
        t46 = $[71];
    }
    let t47;
    if ($[72] !== aiExpanded) {
        t47 = aiExpanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
            size: 14
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 460,
            columnNumber: 24
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
            size: 14
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 460,
            columnNumber: 50
        }, this);
        $[72] = aiExpanded;
        $[73] = t47;
    } else {
        t47 = $[73];
    }
    let t48;
    if ($[74] !== quotaConsuming || $[75] !== t39 || $[76] !== t40 || $[77] !== t42 || $[78] !== t46 || $[79] !== t47) {
        t48 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            id: t39,
            onClick: t40,
            disabled: quotaConsuming,
            style: t42,
            children: [
                t46,
                t47
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 468,
            columnNumber: 11
        }, this);
        $[74] = quotaConsuming;
        $[75] = t39;
        $[76] = t40;
        $[77] = t42;
        $[78] = t46;
        $[79] = t47;
        $[80] = t48;
    } else {
        t48 = $[80];
    }
    let t49;
    if ($[81] !== aiExpanded || $[82] !== signal.aiReasoning?.narrative) {
        t49 = aiExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
            initial: {
                height: 0,
                opacity: 0
            },
            animate: {
                height: "auto",
                opacity: 1
            },
            exit: {
                height: 0,
                opacity: 0
            },
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            },
            style: {
                overflow: "hidden"
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "16px",
                    background: "rgba(124, 58, 237, 0.05)",
                    borderRadius: "0 0 12px 12px",
                    borderLeft: "1px solid rgba(124, 58, 237, 0.15)",
                    borderRight: "1px solid rgba(124, 58, 237, 0.15)",
                    borderBottom: "1px solid rgba(124, 58, 237, 0.15)"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        fontSize: "0.8125rem",
                        color: "#cbd5e1",
                        lineHeight: "1.6"
                    },
                    children: signal.aiReasoning?.narrative || "Analyzing token narrative and social sentiment..."
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 502,
                    columnNumber: 10
                }, this)
            }, void 0, false, {
                fileName: "[project]/web/src/components/TokenCard.tsx",
                lineNumber: 495,
                columnNumber: 8
            }, this)
        }, "ai-reasoning", false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 481,
            columnNumber: 25
        }, this);
        $[81] = aiExpanded;
        $[82] = signal.aiReasoning?.narrative;
        $[83] = t49;
    } else {
        t49 = $[83];
    }
    let t50;
    if ($[84] !== t49) {
        t50 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
            children: t49
        }, void 0, false, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 515,
            columnNumber: 11
        }, this);
        $[84] = t49;
        $[85] = t50;
    } else {
        t50 = $[85];
    }
    let t51;
    if ($[86] !== t48 || $[87] !== t50) {
        t51 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t38,
            children: [
                t48,
                t50
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 523,
            columnNumber: 11
        }, this);
        $[86] = t48;
        $[87] = t50;
        $[88] = t51;
    } else {
        t51 = $[88];
    }
    let t52;
    let t53;
    if ($[89] === Symbol.for("react.memo_cache_sentinel")) {
        t52 = {
            display: "flex",
            gap: "12px"
        };
        t53 = {
            flex: 1,
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            padding: "10px",
            borderRadius: "8px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
        };
        $[89] = t52;
        $[90] = t53;
    } else {
        t52 = $[89];
        t53 = $[90];
    }
    let t54;
    if ($[91] === Symbol.for("react.memo_cache_sentinel")) {
        t54 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t52,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    style: t53,
                    children: [
                        "Swap on Jupiter ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                            size: 14
                        }, void 0, false, {
                            fileName: "[project]/web/src/components/TokenCard.tsx",
                            lineNumber: 560,
                            columnNumber: 64
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 560,
                    columnNumber: 28
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    style: {
                        background: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        border: "1px solid var(--card-border)",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer"
                    },
                    children: "Details"
                }, void 0, false, {
                    fileName: "[project]/web/src/components/TokenCard.tsx",
                    lineNumber: 560,
                    columnNumber: 99
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 560,
            columnNumber: 11
        }, this);
        $[91] = t54;
    } else {
        t54 = $[91];
    }
    let t55;
    if ($[92] !== t25 || $[93] !== t37 || $[94] !== t51 || $[95] !== t7) {
        t55 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
            layout: true,
            initial: t2,
            animate: t3,
            exit: t4,
            transition: t5,
            className: "glass-card",
            style: t6,
            children: [
                t7,
                t25,
                t37,
                t51,
                t54
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/TokenCard.tsx",
            lineNumber: 576,
            columnNumber: 11
        }, this);
        $[92] = t25;
        $[93] = t37;
        $[94] = t51;
        $[95] = t7;
        $[96] = t55;
    } else {
        t55 = $[96];
    }
    return t55;
}
_s(TokenCard, "XNNhCZu1lgIwZ8f6BFovP00/nFs=");
_c = TokenCard;
function _TokenCardAnonymous2(r, i_0) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        style: {
            marginBottom: "4px"
        },
        children: [
            "• ",
            r
        ]
    }, i_0, true, {
        fileName: "[project]/web/src/components/TokenCard.tsx",
        lineNumber: 588,
        columnNumber: 10
    }, this);
}
function _TokenCardAnonymous(c, i) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        style: {
            marginBottom: "4px"
        },
        children: [
            "• ",
            c
        ]
    }, i, true, {
        fileName: "[project]/web/src/components/TokenCard.tsx",
        lineNumber: 593,
        columnNumber: 10
    }, this);
}
var _c;
__turbopack_context__.k.register(_c, "TokenCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/web/src/components/UserStats.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "QuotaMonitor",
    ()=>QuotaMonitor,
    "RankBadge",
    ()=>RankBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/target.js [app-client] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/shield-check.js [app-client] (ecmascript) <export default as ShieldCheck>");
'use client';
;
;
;
function RankBadge(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(31);
    if ($[0] !== "58045fd8ec3584d6d00dcb0ac6b4b83c62df0e37f55c11cb13671bf78bd03d63") {
        for(let $i = 0; $i < 31; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "58045fd8ec3584d6d00dcb0ac6b4b83c62df0e37f55c11cb13671bf78bd03d63";
    }
    const { rank, status, progressPercentage } = t0;
    let t1;
    if ($[1] !== rank) {
        t1 = ({
            "RankBadge[getRankColor]": ()=>{
                switch(rank){
                    case "ELITE":
                        {
                            return "#fcd34d";
                        }
                    case "PRO":
                        {
                            return "#94a3b8";
                        }
                    case "NEWBIE":
                    default:
                        {
                            return "#b45309";
                        }
                }
            }
        })["RankBadge[getRankColor]"];
        $[1] = rank;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    const getRankColor = t1;
    let t2;
    let t3;
    let t4;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = {
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
        };
        t3 = {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
        };
        t4 = {
            display: "flex",
            alignItems: "center",
            gap: "8px"
        };
        $[3] = t2;
        $[4] = t3;
        $[5] = t4;
    } else {
        t2 = $[3];
        t3 = $[4];
        t4 = $[5];
    }
    const t5 = getRankColor();
    let t6;
    if ($[6] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
            size: 16,
            color: t5
        }, void 0, false, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 82,
            columnNumber: 10
        }, this);
        $[6] = t5;
        $[7] = t6;
    } else {
        t6 = $[7];
    }
    let t7;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = {
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "#fff"
        };
        $[8] = t7;
    } else {
        t7 = $[8];
    }
    let t8;
    if ($[9] !== rank) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            style: t7,
            children: rank
        }, void 0, false, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 101,
            columnNumber: 10
        }, this);
        $[9] = rank;
        $[10] = t8;
    } else {
        t8 = $[10];
    }
    let t9;
    if ($[11] !== t6 || $[12] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t4,
            children: [
                t6,
                t8
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 109,
            columnNumber: 10
        }, this);
        $[11] = t6;
        $[12] = t8;
        $[13] = t9;
    } else {
        t9 = $[13];
    }
    let t10;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = {
            fontSize: "0.625rem"
        };
        $[14] = t10;
    } else {
        t10 = $[14];
    }
    let t11;
    if ($[15] !== status) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "badge badge-secondary",
            style: t10,
            children: status
        }, void 0, false, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 127,
            columnNumber: 11
        }, this);
        $[15] = status;
        $[16] = t11;
    } else {
        t11 = $[16];
    }
    let t12;
    if ($[17] !== t11 || $[18] !== t9) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t3,
            children: [
                t9,
                t11
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 135,
            columnNumber: 11
        }, this);
        $[17] = t11;
        $[18] = t9;
        $[19] = t12;
    } else {
        t12 = $[19];
    }
    let t13;
    if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = {
            width: "100%",
            height: "6px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "100px",
            overflow: "hidden"
        };
        $[20] = t13;
    } else {
        t13 = $[20];
    }
    const t14 = `${progressPercentage}%`;
    let t15;
    if ($[21] !== t14) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t13,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    width: t14,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary), var(--secondary))",
                    boxShadow: "0 0 10px var(--secondary-glow)"
                }
            }, void 0, false, {
                fileName: "[project]/web/src/components/UserStats.tsx",
                lineNumber: 158,
                columnNumber: 28
            }, this)
        }, void 0, false, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 158,
            columnNumber: 11
        }, this);
        $[21] = t14;
        $[22] = t15;
    } else {
        t15 = $[22];
    }
    let t16;
    let t17;
    if ($[23] === Symbol.for("react.memo_cache_sentinel")) {
        t16 = {
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.625rem",
            fontWeight: 600,
            color: "var(--text-muted)"
        };
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: "Volume Progression"
        }, void 0, false, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 179,
            columnNumber: 11
        }, this);
        $[23] = t16;
        $[24] = t17;
    } else {
        t16 = $[23];
        t17 = $[24];
    }
    let t18;
    if ($[25] !== progressPercentage) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t16,
            children: [
                t17,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        progressPercentage,
                        "% to Next Level"
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/src/components/UserStats.tsx",
                    lineNumber: 188,
                    columnNumber: 33
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 188,
            columnNumber: 11
        }, this);
        $[25] = progressPercentage;
        $[26] = t18;
    } else {
        t18 = $[26];
    }
    let t19;
    if ($[27] !== t12 || $[28] !== t15 || $[29] !== t18) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "glass-card",
            style: t2,
            children: [
                t12,
                t15,
                t18
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 196,
            columnNumber: 11
        }, this);
        $[27] = t12;
        $[28] = t15;
        $[29] = t18;
        $[30] = t19;
    } else {
        t19 = $[30];
    }
    return t19;
}
_c = RankBadge;
function QuotaMonitor(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(17);
    if ($[0] !== "58045fd8ec3584d6d00dcb0ac6b4b83c62df0e37f55c11cb13671bf78bd03d63") {
        for(let $i = 0; $i < 17; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "58045fd8ec3584d6d00dcb0ac6b4b83c62df0e37f55c11cb13671bf78bd03d63";
    }
    const { used, limit } = t0;
    const remaining = limit - used;
    const percentage = used / limit * 100;
    let t1;
    let t2;
    let t3;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = {
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
        };
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                            size: 16,
                            color: "var(--primary)"
                        }, void 0, false, {
                            fileName: "[project]/web/src/components/UserStats.tsx",
                            lineNumber: 242,
                            columnNumber: 10
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                fontSize: "0.875rem",
                                fontWeight: 700,
                                color: "#fff"
                            },
                            children: "AI Reasoning Quota"
                        }, void 0, false, {
                            fileName: "[project]/web/src/components/UserStats.tsx",
                            lineNumber: 242,
                            columnNumber: 57
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/src/components/UserStats.tsx",
                    lineNumber: 238,
                    columnNumber: 8
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "var(--selection-bg)",
                        fontSize: "0.625rem",
                        fontWeight: 700
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                            size: 12
                        }, void 0, false, {
                            fileName: "[project]/web/src/components/UserStats.tsx",
                            lineNumber: 253,
                            columnNumber: 10
                        }, this),
                        " SECURE"
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/src/components/UserStats.tsx",
                    lineNumber: 246,
                    columnNumber: 43
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 234,
            columnNumber: 10
        }, this);
        t3 = {
            width: "100%",
            height: "6px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "100px",
            overflow: "hidden"
        };
        $[1] = t1;
        $[2] = t2;
        $[3] = t3;
    } else {
        t1 = $[1];
        t2 = $[2];
        t3 = $[3];
    }
    const t4 = `${percentage}%`;
    const t5 = percentage > 80 ? "var(--accent)" : "var(--primary)";
    const t6 = `0 0 10px ${percentage > 80 ? "rgba(244, 63, 94, 0.4)" : "rgba(124, 58, 237, 0.4)"}`;
    let t7;
    if ($[4] !== t4 || $[5] !== t5 || $[6] !== t6) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t3,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    width: t4,
                    height: "100%",
                    background: t5,
                    boxShadow: t6
                }
            }, void 0, false, {
                fileName: "[project]/web/src/components/UserStats.tsx",
                lineNumber: 274,
                columnNumber: 26
            }, this)
        }, void 0, false, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 274,
            columnNumber: 10
        }, this);
        $[4] = t4;
        $[5] = t5;
        $[6] = t6;
        $[7] = t7;
    } else {
        t7 = $[7];
    }
    let t10;
    let t8;
    let t9;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = {
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem"
        };
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            style: {
                color: "var(--text-muted)"
            },
            children: "Usage"
        }, void 0, false, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 296,
            columnNumber: 10
        }, this);
        t10 = {
            fontWeight: 700,
            color: "#fff"
        };
        $[8] = t10;
        $[9] = t8;
        $[10] = t9;
    } else {
        t10 = $[8];
        t8 = $[9];
        t9 = $[10];
    }
    let t11;
    if ($[11] !== limit || $[12] !== remaining) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: t8,
            children: [
                t9,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    style: t10,
                    children: [
                        remaining,
                        " / ",
                        limit,
                        " Units"
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/src/components/UserStats.tsx",
                    lineNumber: 313,
                    columnNumber: 31
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 313,
            columnNumber: 11
        }, this);
        $[11] = limit;
        $[12] = remaining;
        $[13] = t11;
    } else {
        t11 = $[13];
    }
    let t12;
    if ($[14] !== t11 || $[15] !== t7) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "glass-card",
            style: t1,
            children: [
                t2,
                t7,
                t11
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/components/UserStats.tsx",
            lineNumber: 322,
            columnNumber: 11
        }, this);
        $[14] = t11;
        $[15] = t7;
        $[16] = t12;
    } else {
        t12 = $[16];
    }
    return t12;
}
_c1 = QuotaMonitor;
var _c, _c1;
__turbopack_context__.k.register(_c, "RankBadge");
__turbopack_context__.k.register(_c1, "QuotaMonitor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/web/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Dashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$hooks$2f$useSignals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/hooks/useSignals.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$components$2f$TokenCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/components/TokenCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$components$2f$UserStats$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/components/UserStats.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/web/node_modules/lucide-react/dist/esm/icons/activity.js [app-client] (ecmascript) <export default as Activity>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
function Dashboard() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(35);
    if ($[0] !== "3f99b368ebb30eb5643845eaf17495fecf53eb6329d9bee1beadab54609e34f0") {
        for(let $i = 0; $i < 35; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "3f99b368ebb30eb5643845eaf17495fecf53eb6329d9bee1beadab54609e34f0";
    }
    const { signals, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$hooks$2f$useSignals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSignals"])();
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [fetchingProfile, setFetchingProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    let t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = ({
            "Dashboard[useEffect()]": ()=>{
                const fetchProfileData = {
                    "Dashboard[useEffect() > fetchProfileData]": ()=>{
                        const mockProfile = {
                            walletAddress: "rzun...7p2v",
                            rank: "PRO",
                            status: "STARLIGHT",
                            aiQuotaLimit: 10,
                            aiQuotaUsed: 4,
                            volume: {
                                currentMonthVolume: 1250.5,
                                totalFeesPaid: 25.01
                            }
                        };
                        setProfile(mockProfile);
                        setFetchingProfile(false);
                    }
                }["Dashboard[useEffect() > fetchProfileData]"];
                fetchProfileData();
            }
        })["Dashboard[useEffect()]"];
        t1 = [];
        $[1] = t0;
        $[2] = t1;
    } else {
        t0 = $[1];
        t1 = $[2];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t0, t1);
    if (loading || fetchingProfile) {
        let t2;
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
            t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    height: "70vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: "var(--text-muted)",
                        fontSize: "1.25rem",
                        fontWeight: 500
                    },
                    children: "Initializing Neural Core..."
                }, void 0, false, {
                    fileName: "[project]/web/src/app/page.tsx",
                    lineNumber: 66,
                    columnNumber: 10
                }, this)
            }, void 0, false, {
                fileName: "[project]/web/src/app/page.tsx",
                lineNumber: 61,
                columnNumber: 12
            }, this);
            $[3] = t2;
        } else {
            t2 = $[3];
        }
        return t2;
    }
    let t2;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = {
            marginBottom: "48px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px"
        };
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    let t4;
    let t5;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = {
            padding: "24px",
            display: "flex",
            alignItems: "center",
            gap: "20px"
        };
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                padding: "16px",
                background: "rgba(124, 58, 237, 0.1)",
                borderRadius: "16px"
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                color: "var(--primary)",
                size: 32
            }, void 0, false, {
                fileName: "[project]/web/src/app/page.tsx",
                lineNumber: 103,
                columnNumber: 8
            }, this)
        }, void 0, false, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 99,
            columnNumber: 10
        }, this);
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            style: {
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase"
            },
            children: "Volume Current Month"
        }, void 0, false, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 104,
            columnNumber: 10
        }, this);
        $[5] = t3;
        $[6] = t4;
        $[7] = t5;
    } else {
        t3 = $[5];
        t4 = $[6];
        t5 = $[7];
    }
    let t6;
    if ($[8] !== profile?.volume.currentMonthVolume) {
        t6 = profile?.volume.currentMonthVolume.toLocaleString();
        $[8] = profile?.volume.currentMonthVolume;
        $[9] = t6;
    } else {
        t6 = $[9];
    }
    let t7;
    if ($[10] !== t6) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "glass-card",
            style: t3,
            children: [
                t4,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        t5,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "stat-value",
                            children: [
                                "$",
                                t6
                            ]
                        }, void 0, true, {
                            fileName: "[project]/web/src/app/page.tsx",
                            lineNumber: 128,
                            columnNumber: 62
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/src/app/page.tsx",
                    lineNumber: 128,
                    columnNumber: 53
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 128,
            columnNumber: 10
        }, this);
        $[10] = t6;
        $[11] = t7;
    } else {
        t7 = $[11];
    }
    let t8;
    if ($[12] !== profile) {
        t8 = profile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$components$2f$UserStats$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RankBadge"], {
            rank: profile.rank,
            status: profile.status,
            progressPercentage: 45
        }, void 0, false, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 136,
            columnNumber: 21
        }, this);
        $[12] = profile;
        $[13] = t8;
    } else {
        t8 = $[13];
    }
    let t9;
    if ($[14] !== profile) {
        t9 = profile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$components$2f$UserStats$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QuotaMonitor"], {
            used: profile.aiQuotaUsed,
            limit: profile.aiQuotaLimit
        }, void 0, false, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 144,
            columnNumber: 21
        }, this);
        $[14] = profile;
        $[15] = t9;
    } else {
        t9 = $[15];
    }
    let t10;
    if ($[16] !== t7 || $[17] !== t8 || $[18] !== t9) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
            style: t2,
            children: [
                t7,
                t8,
                t9
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 152,
            columnNumber: 11
        }, this);
        $[16] = t7;
        $[17] = t8;
        $[18] = t9;
        $[19] = t10;
    } else {
        t10 = $[19];
    }
    let t11;
    if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                width: "8px",
                                height: "8px",
                                background: "var(--secondary)",
                                borderRadius: "50%",
                                boxShadow: "0 0 10px var(--secondary-glow)"
                            }
                        }, void 0, false, {
                            fileName: "[project]/web/src/app/page.tsx",
                            lineNumber: 171,
                            columnNumber: 10
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            style: {
                                fontSize: "1.5rem",
                                fontWeight: 700
                            },
                            children: "Real-time Alpha Feed"
                        }, void 0, false, {
                            fileName: "[project]/web/src/app/page.tsx",
                            lineNumber: 177,
                            columnNumber: 14
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/src/app/page.tsx",
                    lineNumber: 167,
                    columnNumber: 8
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        gap: "12px"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            style: {
                                background: "rgba(255,255,255,0.05)",
                                color: "#fff",
                                border: "1px solid var(--card-border)",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontSize: "0.875rem",
                                fontWeight: 600
                            },
                            children: "All Signals"
                        }, void 0, false, {
                            fileName: "[project]/web/src/app/page.tsx",
                            lineNumber: 183,
                            columnNumber: 10
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            style: {
                                background: "var(--primary)",
                                color: "#fff",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontSize: "0.875rem",
                                fontWeight: 600
                            },
                            children: "VIP Only"
                        }, void 0, false, {
                            fileName: "[project]/web/src/app/page.tsx",
                            lineNumber: 191,
                            columnNumber: 32
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/web/src/app/page.tsx",
                    lineNumber: 180,
                    columnNumber: 43
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 162,
            columnNumber: 11
        }, this);
        $[20] = t11;
    } else {
        t11 = $[20];
    }
    let t12;
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "24px"
        };
        $[21] = t12;
    } else {
        t12 = $[21];
    }
    let t13;
    if ($[22] !== profile?.status || $[23] !== signals) {
        let t14;
        if ($[25] !== profile?.status) {
            t14 = ({
                "Dashboard[signals.map()]": (signal)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$components$2f$TokenCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenCard"], {
                        signal: signal,
                        isVIP: profile?.status === "VIP"
                    }, signal.mint, false, {
                        fileName: "[project]/web/src/app/page.tsx",
                        lineNumber: 220,
                        columnNumber: 47
                    }, this)
            })["Dashboard[signals.map()]"];
            $[25] = profile?.status;
            $[26] = t14;
        } else {
            t14 = $[26];
        }
        t13 = signals.map(t14);
        $[22] = profile?.status;
        $[23] = signals;
        $[24] = t13;
    } else {
        t13 = $[24];
    }
    let t14;
    if ($[27] !== t13) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
            mode: "popLayout",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: t12,
                children: t13
            }, void 0, false, {
                fileName: "[project]/web/src/app/page.tsx",
                lineNumber: 236,
                columnNumber: 45
            }, this)
        }, void 0, false, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 236,
            columnNumber: 11
        }, this);
        $[27] = t13;
        $[28] = t14;
    } else {
        t14 = $[28];
    }
    let t15;
    if ($[29] !== signals.length) {
        t15 = signals.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                padding: "64px",
                textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "24px",
                border: "1px dashed var(--card-border)"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                    size: 48,
                    color: "var(--text-muted)",
                    style: {
                        marginBottom: "16px",
                        opacity: 0.3
                    }
                }, void 0, false, {
                    fileName: "[project]/web/src/app/page.tsx",
                    lineNumber: 250,
                    columnNumber: 8
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    style: {
                        color: "#fff",
                        marginBottom: "8px"
                    },
                    children: "Scanning for Alpha Signals..."
                }, void 0, false, {
                    fileName: "[project]/web/src/app/page.tsx",
                    lineNumber: 253,
                    columnNumber: 12
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: "var(--text-muted)",
                        fontSize: "0.875rem"
                    },
                    children: "The geyser is currently monitoring Pump.fun and Raydium streams."
                }, void 0, false, {
                    fileName: "[project]/web/src/app/page.tsx",
                    lineNumber: 256,
                    columnNumber: 44
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 244,
            columnNumber: 35
        }, this);
        $[29] = signals.length;
        $[30] = t15;
    } else {
        t15 = $[30];
    }
    let t16;
    if ($[31] !== t10 || $[32] !== t14 || $[33] !== t15) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "animate-fade-in",
            children: [
                t10,
                t11,
                t14,
                t15
            ]
        }, void 0, true, {
            fileName: "[project]/web/src/app/page.tsx",
            lineNumber: 267,
            columnNumber: 11
        }, this);
        $[31] = t10;
        $[32] = t14;
        $[33] = t15;
        $[34] = t16;
    } else {
        t16 = $[34];
    }
    return t16;
}
_s(Dashboard, "gkqKlHzESXD+qaUpn7Agjmkse20=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$hooks$2f$useSignals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSignals"]
    ];
});
_c = Dashboard;
var _c;
__turbopack_context__.k.register(_c, "Dashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=web_src_0nk43av._.js.map