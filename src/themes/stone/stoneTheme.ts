/**
 * Stone Theme
 *
 * A warm, earthy neutral theme inspired by natural stone and sandstone.
 * Core palette: #28282A, #84848B, #D8D8DB, #f3f3f5, #FFFFFF
 * Montserrat for headings, Figtree for body, JetBrains Mono for code.
 */

import { defineTheme, defineSyntaxTheme } from "@astryxdesign/core/theme";
import { stoneIconRegistry } from "./icons";

/**
 * Input status border overrides (per-component, per-status). All 9 input
 * components share inputStatusBorderStyles in core, which read
 * --color-{success,warning,error} (T30 light / T80 dark = saturated text
 * tone). Stone redefines those vars inside each input's status scope to
 * T60 light / T70 dark so the border (and the matching status icon) reads
 * as a softer hue rim, in line with the gentle T90 status message bubble.
 */
const INPUT_STATUS_VARS = {
  "status:success": {
    "--color-success": "light-dark(#2e7d32, #81c784)", // Soft Forest / Sage Green
  },
  "status:warning": {
    "--color-warning": "light-dark(#b47818, #f6b244)", // Soft Warm Amber
  },
  "status:error": {
    "--color-error": "light-dark(#c2413a, #e57373)", // Soft Terracotta Red
  },
} as const;

/**
 * Stone syntax palette — light values snap to T40 / T45 stops on the
 * stone categorical ramps (per audit drawer); dark values stay at T70.
 *
 * `string` and `property` both land on Teal T40 — intentional; the audit
 * unified them since green and teal are visually adjacent at T40 and
 * the stone neutral palette doesn't carry a distinct green stop.
 */
const stoneSyntax = defineSyntaxTheme({
  name: "xds-stone",
  tokens: {
    keyword: ["#645a72", "#b2a7c1"], // Purple T40 / T70
    string: ["#4e6357", "#9bb19a"], // Teal T40 / Green T70
    comment: ["#5e5e5e", "#ababb0"], // Stone Neutral T40 / T70
    number: ["#755752", "#bea792"], // Red T40 / Orange T70
    function: ["#506072", "#99adc6"], // Blue T40 / T70
    type: ["#645a72", "#b2a7c1"], // Purple T40 / T70
    variable: ["#5e5e5e", "#ababb0"], // Stone Neutral T40 / T70
    operator: ["#5e5e5e", "#ababb0"], // Stone Neutral T40 / T70
    constant: ["#755752", "#bea792"], // Red T40 / Orange T70
    tag: ["#775751", "#c7a39d"], // Red T40 / T70
    attribute: ["#79693f", "#b6aa90"], // Yellow T45 / T70
    property: ["#4e6357", "#94b2a0"], // Teal T40 / T70
    punctuation: ["#5e5e5e", "#ababb0"], // Stone Neutral T40 / T70
    background: ["#f3f3f5", "#171719"],
  },
});

export const stoneTheme = defineTheme({
  name: "stone",

  typography: {
    scale: { base: 14, ratio: 1.25 },
    body: {
      family: "Figtree",
      fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: "Montserrat",
      fallbacks: '"Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      weights: { 3: "bold", 4: "bold" },
    },
    code: {
      family: "JetBrains Mono",
      fallbacks: '"SF Mono", Monaco, Consolas, monospace',
    },
  },

  motion: { fast: 125, medium: 300, slow: 700, ratio: 0.75 },

  syntax: stoneSyntax,

  tokens: {
    // =========================================================================
    // Colors — warm stone palette
    // Core: #28282A, #84848B, #D8D8DB, #f3f3f5, #FFFFFF
    // =========================================================================

    // Core semantic — all neutrals H=291
    // Stone 900 T=16 C=1.4, Stone 500 T=55 C=4, Stone 300 T=86 C=1.6, Stone 100 T=96 C=1
    "--color-accent": ["#25252a", "#f3f3f5"], // light: Stone Neutral T15
    "--color-accent-muted": ["#25252a14", "#f3f3f520"], // light: Stone Neutral T15 · 8% / dark: T96 · 12.5%
    "--color-neutral": ["#25252a0f", "#f3f3f51a"], // light: Stone Neutral T15 · 6% / dark: T96 · 10%
    "--color-background-surface": ["#ffffff", "#1b1b1f"], // dark: Stone Neutral T10
    "--color-background-body": ["#f3f3f5", "#111015"], // dark: Stone Neutral T5
    "--color-overlay": ["#25252a80", "#28282acc"], // light: Stone Neutral T15 · 50% / dark: 80%
    "--color-overlay-hover": ["#25252a0d", "#f3f3f50d"], // light: Stone Neutral T15 · 5% / dark: T96 · 5%
    "--color-overlay-pressed": ["#25252a1a", "#f3f3f51a"], // light: Stone Neutral T15 · 10% / dark: T96 · 10%
    "--color-background-muted": ["#e2e2e8", "#3b3b3f"], // light: Stone Neutral T90

    // Text — H=291
    "--color-text-primary": ["#25252a", "#f3f3f5"], // light: Stone Neutral T15
    "--color-text-secondary": ["#83838a", "#9d9da3"], // T55 C=4 / T65 C=3
    "--color-text-disabled": ["#d7d7da", "#5e5e61"], // T86 C=1.6 / T40 C=2
    "--color-text-accent": ["#25252a", "#f3f3f5"], // light: Stone Neutral T15
    "--color-on-dark": "#FFFFFF",
    "--color-on-light": ["#25252a", "#28282a"], // light: Stone Neutral T15
    "--color-on-accent": ["#ffffff", "#25252a"], // dark: Stone Neutral T15
    // Text on top of matching status surface (badge fill, banner content).
    "--color-on-success": ["#1b5e20", "#c8e6c9"], // Soft Forest Green
    "--color-on-error": ["#84201c", "#ffcdd2"], // Soft Terracotta Red
    "--color-on-warning": ["#784a08", "#ffecb3"], // Soft Warm Amber

    // Icon — H=291
    "--color-icon-accent": ["#25252a", "#f3f3f5"], // light: Stone Neutral T15
    "--color-icon-primary": ["#25252a", "#f3f3f5"], // light: Stone Neutral T15
    "--color-icon-secondary": ["#83838a", "#9d9da3"], // T55 C=4 / T65 C=3
    "--color-icon-disabled": ["#d7d7da", "#5e5e61"], // T86 C=1.6 / T40 C=2

    // Surface variants — H=291
    "--color-background-card": ["#FFFFFF", "#242325"], // T14
    "--color-background-popover": ["#ffffff", "#25252a"], // dark: Stone Neutral T15
    "--color-background-inverted": ["#25252a", "#f3f3f5"], // light: Stone Neutral T15

    // Status / Sentiment — Soft, warm & clear visible color
    "--color-success": ["#2e7d32", "#81c784"], // Soft Forest / Sage Green
    "--color-success-muted": ["#eaf5ec", "#1c3322"], // Soft Sage Surface
    "--color-error": ["#c2413a", "#e57373"], // Soft Terracotta Red
    "--color-error-muted": ["#fbeeed", "#3a1d1d"], // Soft Rose Surface
    "--color-warning": ["#b47818", "#f6b244"], // Soft Warm Amber
    "--color-warning-muted": ["#fdf6e7", "#382914"], // Soft Amber Surface

    // Border — H=291
    "--color-border": ["#e2e2e8", "#f3f3f51a"], // light: Stone Neutral T90 / dark: T96 · 10%
    "--color-border-emphasized": ["#83838a", "#5e5e61"], // T55 C=4 / T40 C=2

    // Effects — H=291
    "--color-skeleton": ["#d4d4da", "#5e5e64"], // T85 / T40 from H=291 C=3
    "--color-shadow": ["#25252a1a", "#0000004d"], // light: Stone Neutral T15 · 10% / dark: 30%
    "--color-tint-hover": ["black", "white"],

    // Typography override
    "--text-supporting-size": "12px",

    // Categorical hues — Soft, balanced & harmonious
    // Categorical — Blue
    "--color-background-blue": ["#e8f2fa", "#193347"],
    "--color-border-blue": ["#cde2f3", "#254964"],
    "--color-icon-blue": ["#36729e", "#7ab8e6"],
    "--color-text-blue": ["#36729e", "#7ab8e6"],

    // Categorical — Cyan
    "--color-background-cyan": ["#e3f7f8", "#14373b"],
    "--color-border-cyan": ["#beecef", "#1e5055"],
    "--color-icon-cyan": ["#207e86", "#6cd0da"],
    "--color-text-cyan": ["#207e86", "#6cd0da"],

    // Categorical — Gray
    "--color-background-gray": ["#e2e2e8", "#525257"],
    "--color-border-gray": ["#d4d4da", "#3b3b3f"],
    "--color-icon-gray": ["#46464b", "#e2e2e8"],
    "--color-text-gray": ["#46464b", "#e2e2e8"],

    // Categorical — Green
    "--color-background-green": ["#eaf5ec", "#1c3322"],
    "--color-border-green": ["#cde8d1", "#274a30"],
    "--color-icon-green": ["#2e7d32", "#81c784"],
    "--color-text-green": ["#2e7d32", "#81c784"],

    // Categorical — Orange
    "--color-background-orange": ["#fdf0e6", "#3d2214"],
    "--color-border-orange": ["#f9d9bf", "#59331d"],
    "--color-icon-orange": ["#c4591a", "#f39659"],
    "--color-text-orange": ["#c4591a", "#f39659"],

    // Categorical — Pink
    "--color-background-pink": ["#fcecf4", "#3d1b2d"],
    "--color-border-pink": ["#f7d0e3", "#592742"],
    "--color-icon-pink": ["#b83d7a", "#e87bb1"],
    "--color-text-pink": ["#b83d7a", "#e87bb1"],

    // Categorical — Purple
    "--color-background-purple": ["#f4eefc", "#2d1c3e"],
    "--color-border-purple": ["#e2d2f7", "#442a5e"],
    "--color-icon-purple": ["#7948b8", "#b68ced"],
    "--color-text-purple": ["#7948b8", "#b68ced"],

    // Categorical — Red
    "--color-background-red": ["#fbeeed", "#3a1d1d"],
    "--color-border-red": ["#f6d4d1", "#542828"],
    "--color-icon-red": ["#c2413a", "#e57373"],
    "--color-text-red": ["#c2413a", "#e57373"],

    // Categorical — Teal
    "--color-background-teal": ["#e3f6f1", "#14362e"],
    "--color-border-teal": ["#bfeadb", "#1e4e42"],
    "--color-icon-teal": ["#217964", "#67cbb3"],
    "--color-text-teal": ["#217964", "#67cbb3"],

    // Categorical — Yellow
    "--color-background-yellow": ["#fdf6e7", "#382914"],
    "--color-border-yellow": ["#fae5b9", "#523b1c"],
    "--color-icon-yellow": ["#b47818", "#f6b244"],
    "--color-text-yellow": ["#b47818", "#f6b244"],

    // =========================================================================
    // Radius — clean and subtle
    //   --radius-none and --radius-full are always fixed and must never be
    //   scaled by a theme (see defineTheme's radius config docs) — 0 and
    //   9999px respectively, matching @astryxdesign/core's own defaults.
    // =========================================================================
    "--radius-none": "0px",
    "--radius-inner": "0.25rem",
    "--radius-element": "0.5rem",
    "--radius-container": "0.75rem",
    "--radius-page": "1.5rem",
    "--radius-full": "9999px",

    // =========================================================================
    // Shadows
    // =========================================================================
    "--shadow-low": "0 2px 4px #28282A0D, 0 4px 8px #28282A1A",
    "--shadow-med": "0 2px 4px #28282A0D, 0 4px 12px #28282A1A",
    "--shadow-high": "0 4px 6px #28282A1A, 0 12px 24px #28282A26",
    "--shadow-inset-hover": "inset 0px 0px 0px 2px #28282A30",
    "--shadow-inset-selected": "inset 0px 0px 0px 2px #28282A50",
    "--shadow-inset-success": "inset 0px 0px 0px 2px #83838a30",
    "--shadow-inset-warning": "inset 0px 0px 0px 2px #83838a30",
    "--shadow-inset-error": "inset 0px 0px 0px 2px #83838a30",
  },

  components: {
    button: {
      base: {
        borderRadius: "var(--radius-full)",
      },
      "variant:secondary": {
        backgroundColor: "transparent",
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "var(--color-border-emphasized)",
        ":hover": {
          backgroundColor: "var(--color-neutral)",
        },
      },
      "variant:destructive": {
        backgroundColor: "var(--color-background-red)",
        color: "var(--color-text-red)",
      },
    },

    // Semantic variants point at categorical hue tokens — single source of truth.
    badge: {
      base: {
        display: "inline-flex",
        alignItems: "center",
        lineHeight: "1",
      },
      "variant:info": {
        backgroundColor: "var(--color-background-blue)",
        color: "var(--color-text-blue)",
      },
      "variant:neutral": {
        backgroundColor: "var(--color-background-gray)",
        color: "var(--color-text-gray)",
      },
      "variant:success": {
        backgroundColor: "var(--color-background-green)",
        color: "var(--color-text-green)",
      },
      "variant:warning": {
        backgroundColor: "var(--color-background-yellow)",
        color: "var(--color-text-yellow)",
      },
      "variant:error": {
        backgroundColor: "var(--color-background-red)",
        color: "var(--color-text-red)",
      },
    },

    // StyleX paints the banner surface from @layer priority4 (above
    // @layer astryx-theme), so a direct backgroundColor override loses the
    // cascade. Redefine the muted token instead so StyleX's var() resolves
    // to the categorical bg in our scope.
    banner: {
      "status:info": {
        "--color-accent-muted": "var(--color-background-blue)",
        "--color-text-primary": "var(--color-text-blue)",
        "--color-text-secondary": "var(--color-text-blue)",
        "--color-accent": "var(--color-text-blue)",
      },
      "status:success": {
        "--color-success-muted": "var(--color-background-green)",
        "--color-text-primary": "var(--color-text-green)",
        "--color-text-secondary": "var(--color-text-green)",
        "--color-success": "var(--color-text-green)",
      },
      "status:warning": {
        "--color-warning-muted": "var(--color-background-yellow)",
        "--color-text-primary": "var(--color-text-yellow)",
        "--color-text-secondary": "var(--color-text-yellow)",
        "--color-warning": "var(--color-text-yellow)",
      },
      "status:error": {
        "--color-error-muted": "var(--color-background-red)",
        "--color-text-primary": "var(--color-text-red)",
        "--color-text-secondary": "var(--color-text-red)",
        "--color-error": "var(--color-text-red)",
      },
    },

    // Fill: light = T90 (same hex as banner/badge surface — fill reads as
    // the same color family as the matching status surface). Dark = T70.
    // Hexes from the preview Tonal Palettes ramp. accent (default) +
    // indeterminate both route to blue for the in-progress / loading look.
    "progressbar-fill": {
      "variant:accent": {
        backgroundColor: "light-dark(#36729e, #7ab8e6)", // Soft Slate Blue
      },
      "variant:success": {
        backgroundColor: "light-dark(#2e7d32, #81c784)", // Soft Forest Green
      },
      "variant:warning": {
        backgroundColor: "light-dark(#b47818, #f6b244)", // Soft Warm Amber
      },
      "variant:error": {
        backgroundColor: "light-dark(#c2413a, #e57373)", // Soft Terracotta Red
      },
    },

    // Track default --color-background-muted reads near-body in stone;
    // redirect to --color-skeleton so the channel stays visible.
    "progressbar-track": {
      base: {
        backgroundColor: "var(--color-skeleton)",
      },
    },

    // Switch off-state track reads --color-background-gray by default.
    // Redefine it inside the switch scope to --color-skeleton, matching
    // the ProgressBar track. The on-state reads --color-accent (unaffected);
    // disabled-off also picks up --color-skeleton for consistency.
    switch: {
      base: {
        "--color-background-gray": "var(--color-skeleton)",
      },
    },

    // FieldStatus surface matches badge — see badge override above.
    "field-status": {
      "type:success": {
        backgroundColor: "var(--color-background-green)",
      },
      "type:warning": {
        backgroundColor: "var(--color-background-yellow)",
      },
      "type:error": {
        backgroundColor: "var(--color-background-red)",
      },
    },

    // Input status borders + icons across all 9 input components share the
    // same softer T60/T70 redirection. See INPUT_STATUS_VARS above.
    "text-input": INPUT_STATUS_VARS,
    textarea: INPUT_STATUS_VARS,
    "number-input": INPUT_STATUS_VARS,
    "date-input": INPUT_STATUS_VARS,
    "time-input": INPUT_STATUS_VARS,
    selector: INPUT_STATUS_VARS,
    "multi-selector": INPUT_STATUS_VARS,
    typeahead: INPUT_STATUS_VARS,
    tokenizer: INPUT_STATUS_VARS,

    card: {
      base: {
        padding: "var(--spacing-3)",
      },
    },

    section: {
      base: {
        padding: "var(--spacing-3)",
      },
    },
  },

  icons: stoneIconRegistry,
});

/**
 * Raw tonal palettes — every color at every tone step (0–100 in 5s).
 * Same hue and chroma used to derive all theme tokens.
 * Use these for custom components or data visualization.
 */
export const stonePalettes = {
  neutral: {
    hue: 291,
    chroma: 3,
    0: "#000000",
    5: "#111015",
    10: "#1b1b1f",
    15: "#25252a",
    20: "#303034",
    25: "#3b3b3f",
    30: "#46464b",
    35: "#525257",
    40: "#5e5e63",
    45: "#6a6a6f",
    50: "#77777c",
    55: "#838388",
    60: "#909095",
    65: "#9d9da3",
    70: "#ababb0",
    75: "#b8b8be",
    80: "#c6c6cc",
    85: "#d4d4da",
    90: "#e2e2e8",
    95: "#f0f0f6",
    100: "#ffffff",
  },
  blue: {
    hue: 265,
    chroma: 10,
    0: "#000000",
    5: "#04121e",
    10: "#111c29",
    15: "#1b2734",
    20: "#26313f",
    25: "#313c4a",
    30: "#3c4856",
    35: "#485362",
    40: "#545f6e",
    45: "#606c7b",
    50: "#6c7888",
    55: "#798595",
    60: "#8692a2",
    65: "#939faf",
    70: "#a0acbd",
    75: "#adbacb",
    80: "#bbc8d9",
    85: "#c9d6e7",
    90: "#d7e4f5",
    95: "#e7f2ff",
    100: "#ffffff",
  },
  cyan: {
    hue: 190,
    chroma: 10,
    0: "#000000",
    5: "#001613",
    10: "#071f1e",
    15: "#122a28",
    20: "#1d3433",
    25: "#28403e",
    30: "#334b49",
    35: "#3e5755",
    40: "#4a6361",
    45: "#566f6d",
    50: "#627c7a",
    55: "#6f8986",
    60: "#7b9693",
    65: "#88a3a0",
    70: "#95b1ae",
    75: "#a3bebb",
    80: "#b0ccc9",
    85: "#bedad7",
    90: "#cce8e5",
    95: "#daf7f4",
    100: "#ffffff",
  },
  green: {
    hue: 142,
    chroma: 17,
    0: "#000000",
    5: "#001700",
    10: "#0c200a",
    15: "#162a16",
    20: "#213521",
    25: "#2b402b",
    30: "#374c36",
    35: "#425841",
    40: "#4e644d",
    45: "#5a7059",
    50: "#667d65",
    55: "#728a71",
    60: "#7f977e",
    65: "#8ca48b",
    70: "#99b298",
    75: "#a7bfa5",
    80: "#b4cdb2",
    85: "#c2dbc0",
    90: "#d0e9ce",
    95: "#def8dc",
    100: "#ffffff",
  },
  teal: {
    hue: 158,
    chroma: 9,
    0: "#000000",
    5: "#00150a",
    10: "#101e17",
    15: "#1a2921",
    20: "#25342b",
    25: "#303f36",
    30: "#3b4a41",
    35: "#46564d",
    40: "#526259",
    45: "#5e6e65",
    50: "#6a7b71",
    55: "#77887e",
    60: "#83958a",
    65: "#90a297",
    70: "#9dafa5",
    75: "#abbdb2",
    80: "#b8cbc0",
    85: "#c6d9ce",
    90: "#d4e7dc",
    95: "#e2f5ea",
    100: "#ffffff",
  },
  yellow: {
    hue: 90,
    chroma: 23,
    0: "#000000",
    5: "#1f0f00",
    10: "#261a00",
    15: "#2f2500",
    20: "#3a2f0d",
    25: "#463a18",
    30: "#524622",
    35: "#5e512d",
    40: "#6b5d39",
    45: "#786944",
    50: "#857650",
    55: "#92825c",
    60: "#9f8f68",
    65: "#ad9c75",
    70: "#bbaa81",
    75: "#c9b78e",
    80: "#d7c59c",
    85: "#e5d3a9",
    90: "#f4e1b7",
    95: "#ffefc7",
    100: "#ffffff",
  },
  orange: {
    hue: 70,
    chroma: 22,
    0: "#000000",
    5: "#250a00",
    10: "#2d1700",
    15: "#372104",
    20: "#432c12",
    25: "#4f361c",
    30: "#5b4227",
    35: "#684d32",
    40: "#75593d",
    45: "#826548",
    50: "#8f7154",
    55: "#9d7e60",
    60: "#aa8b6d",
    65: "#b89879",
    70: "#c6a586",
    75: "#d4b393",
    80: "#e3c0a0",
    85: "#f1ceae",
    90: "#ffdcbb",
    95: "#ffeddc",
    100: "#ffffff",
  },
  red: {
    hue: 33,
    chroma: 11,
    0: "#000000",
    5: "#210a04",
    10: "#2a1714",
    15: "#35211e",
    20: "#402b28",
    25: "#4c3633",
    30: "#58413e",
    35: "#644d49",
    40: "#715955",
    45: "#7e6561",
    50: "#8a716d",
    55: "#987e7a",
    60: "#a58b86",
    65: "#b39893",
    70: "#c0a5a1",
    75: "#ceb3ae",
    80: "#dcc0bc",
    85: "#ebcec9",
    90: "#f9dcd7",
    95: "#ffece9",
    100: "#ffffff",
  },
  pink: {
    hue: 340,
    chroma: 9,
    0: "#000000",
    5: "#1b0c16",
    10: "#251720",
    15: "#30222a",
    20: "#3b2c35",
    25: "#463740",
    30: "#52424c",
    35: "#5e4e57",
    40: "#6a5a63",
    45: "#776670",
    50: "#83727c",
    55: "#907f89",
    60: "#9d8c96",
    65: "#ab99a3",
    70: "#b8a6b1",
    75: "#c6b4be",
    80: "#d4c1cc",
    85: "#e2cfda",
    90: "#f0dde8",
    95: "#ffebf7",
    100: "#ffffff",
  },
  purple: {
    hue: 307,
    chroma: 11,
    0: "#000000",
    5: "#150e1d",
    10: "#1f1927",
    15: "#292332",
    20: "#342e3d",
    25: "#3f3949",
    30: "#4b4454",
    35: "#564f60",
    40: "#635b6d",
    45: "#6f6779",
    50: "#7b7486",
    55: "#888193",
    60: "#958da0",
    65: "#a39aad",
    70: "#b0a8bb",
    75: "#beb5c9",
    80: "#cbc3d7",
    85: "#d9d1e5",
    90: "#e8dff3",
    95: "#f6edff",
    100: "#ffffff",
  },
} as const;
