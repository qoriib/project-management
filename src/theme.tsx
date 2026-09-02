import { defineTheme, defineSyntaxTheme } from "@astryxdesign/core/theme";
import type { IconRegistry } from "@astryxdesign/core/Icon";
import {
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  ExternalLink,
  Menu,
  MoreHorizontal,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  EyeOff,
  Columns,
  Copy,
  CheckCheck,
  Wrench,
  Square,
  Mic,
} from "lucide-react";

const iconProps = {
  size: "1em",
  "aria-hidden": true as const,
};

export const appIconRegistry: IconRegistry = {
  close: <X {...iconProps} />,
  chevronDown: <ChevronDown {...iconProps} />,
  chevronLeft: <ChevronLeft {...iconProps} />,
  chevronRight: <ChevronRight {...iconProps} />,
  chevronsLeft: <ChevronsLeft {...iconProps} />,
  chevronsRight: <ChevronsRight {...iconProps} />,
  check: <Check {...iconProps} />,
  success: <CheckCircle {...iconProps} />,
  error: <XCircle {...iconProps} />,
  warning: <AlertTriangle {...iconProps} />,
  info: <Info {...iconProps} />,
  calendar: <Calendar {...iconProps} />,
  clock: <Clock {...iconProps} />,
  externalLink: <ExternalLink {...iconProps} />,
  menu: <Menu {...iconProps} />,
  moreHorizontal: <MoreHorizontal {...iconProps} />,
  search: <Search {...iconProps} />,
  arrowUp: <ArrowUp {...iconProps} />,
  arrowDown: <ArrowDown {...iconProps} />,
  arrowsUpDown: <ArrowUpDown {...iconProps} />,
  funnel: <Filter {...iconProps} />,
  eyeSlash: <EyeOff {...iconProps} />,
  viewColumns: <Columns {...iconProps} />,
  copy: <Copy {...iconProps} />,
  checkDouble: <CheckCheck {...iconProps} />,
  wrench: <Wrench {...iconProps} />,
  stop: <Square {...iconProps} />,
  microphone: <Mic {...iconProps} />,
};

const INPUT_STATUS_VARS = {
  "status:success": {
    "--color-success": "light-dark(#2e7d32, #81c784)",
  },
  "status:warning": {
    "--color-warning": "light-dark(#b47818, #f6b244)",
  },
  "status:error": {
    "--color-error": "light-dark(#c62828, #ef5350)",
  },
} as const;

const appSyntax = defineSyntaxTheme({
  name: "xds-app",
  tokens: {
    keyword: ["#c62828", "#ef5350"],
    string: ["#2e7d32", "#81c784"],
    comment: ["#757575", "#9e9e9e"],
    number: ["#b47818", "#f6b244"],
    function: ["#c62828", "#e53935"],
    type: ["#c62828", "#ef5350"],
    variable: ["#212121", "#f5f5f5"],
    operator: ["#757575", "#9e9e9e"],
    constant: ["#b47818", "#f6b244"],
    tag: ["#c62828", "#e53935"],
    attribute: ["#784a08", "#ffecb3"],
    property: ["#217964", "#67cbb3"],
    punctuation: ["#757575", "#9e9e9e"],
    background: ["#f9f9fb", "#121214"],
  },
});

export const appTheme = defineTheme({
  name: "app-theme",

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

  syntax: appSyntax,

  tokens: {
    "--color-accent": ["#c62828", "#e53935"],
    "--color-accent-muted": ["#c6282812", "#e539351f"],
    "--color-neutral": ["#00000008", "#ffffff12"],

    "--color-background-surface": ["#ffffff", "#1c1c20"],
    "--color-background-body": ["#f9f9fb", "#121214"],

    "--color-overlay": ["#00000066", "#000000b3"],
    "--color-overlay-hover": ["#0000000a", "#ffffff0d"],
    "--color-overlay-pressed": ["#00000014", "#ffffff1a"],
    "--color-background-muted": ["#f0f0f4", "#26262c"],

    "--color-text-primary": ["#1a1a1e", "#f5f5f7"],
    "--color-text-secondary": ["#70707c", "#9c9ca8"],
    "--color-text-disabled": ["#bdbdbd", "#54545e"],
    "--color-text-accent": ["#c62828", "#ef5350"],
    "--color-on-dark": "#FFFFFF",
    "--color-on-light": ["#1a1a1e", "#1a1a1e"],
    "--color-on-accent": ["#ffffff", "#ffffff"],
    "--color-on-success": ["#1b5e20", "#c8e6c9"],
    "--color-on-error": ["#84201c", "#ffcdd2"],
    "--color-on-warning": ["#784a08", "#ffecb3"],

    "--color-icon-accent": ["#c62828", "#ef5350"],
    "--color-icon-primary": ["#1a1a1e", "#f5f5f7"],
    "--color-icon-secondary": ["#70707c", "#9c9ca8"],
    "--color-icon-disabled": ["#bdbdbd", "#54545e"],

    "--color-background-card": ["#ffffff", "#1c1c20"],
    "--color-background-popover": ["#ffffff", "#222226"],
    "--color-background-inverted": ["#1a1a1e", "#f5f5f7"],

    "--color-success": ["#2e7d32", "#81c784"],
    "--color-success-muted": ["#eaf5ec", "#1c3322"],
    "--color-error": ["#c62828", "#ef5350"],
    "--color-error-muted": ["#fbeeed", "#3a1d1d"],
    "--color-warning": ["#b47818", "#f6b244"],
    "--color-warning-muted": ["#fdf6e7", "#382914"],

    "--color-border": ["#e0e0e6", "#ffffff1a"],
    "--color-border-emphasized": ["#70707c", "#54545e"],

    "--color-skeleton": ["#e0e0e6", "#2c2c34"],
    "--color-shadow": ["#00000014", "#00000066"],
    "--color-tint-hover": ["black", "white"],

    "--text-supporting-size": "12px",

    "--color-background-blue": ["#e8f2fa", "#193347"],
    "--color-border-blue": ["#cde2f3", "#254964"],
    "--color-icon-blue": ["#36729e", "#7ab8e6"],
    "--color-text-blue": ["#36729e", "#7ab8e6"],

    "--color-background-cyan": ["#e3f7f8", "#14373b"],
    "--color-border-cyan": ["#beecef", "#1e5055"],
    "--color-icon-cyan": ["#207e86", "#6cd0da"],
    "--color-text-cyan": ["#207e86", "#6cd0da"],

    "--color-background-gray": ["#f0f0f4", "#2c2c34"],
    "--color-border-gray": ["#e0e0e6", "#3b3b44"],
    "--color-icon-gray": ["#70707c", "#e0e0e6"],
    "--color-text-gray": ["#70707c", "#e0e0e6"],

    "--color-background-green": ["#eaf5ec", "#1c3322"],
    "--color-border-green": ["#cde8d1", "#274a30"],
    "--color-icon-green": ["#2e7d32", "#81c784"],
    "--color-text-green": ["#2e7d32", "#81c784"],

    "--color-background-orange": ["#fdf0e6", "#3d2214"],
    "--color-border-orange": ["#f9d9bf", "#59331d"],
    "--color-icon-orange": ["#c4591a", "#f39659"],
    "--color-text-orange": ["#c4591a", "#f39659"],

    "--color-background-pink": ["#fcecf4", "#3d1b2d"],
    "--color-border-pink": ["#f7d0e3", "#592742"],
    "--color-icon-pink": ["#b83d7a", "#e87bb1"],
    "--color-text-pink": ["#b83d7a", "#e87bb1"],

    "--color-background-purple": ["#f4eefc", "#2d1c3e"],
    "--color-border-purple": ["#e2d2f7", "#442a5e"],
    "--color-icon-purple": ["#7948b8", "#b68ced"],
    "--color-text-purple": ["#7948b8", "#b68ced"],

    "--color-background-red": ["#fbeeed", "#3a1d1d"],
    "--color-border-red": ["#f6d4d1", "#542828"],
    "--color-icon-red": ["#c62828", "#ef5350"],
    "--color-text-red": ["#c62828", "#ef5350"],

    "--color-background-teal": ["#e3f6f1", "#14362e"],
    "--color-border-teal": ["#bfeadb", "#1e4e42"],
    "--color-icon-teal": ["#217964", "#67cbb3"],
    "--color-text-teal": ["#217964", "#67cbb3"],

    "--color-background-yellow": ["#fdf6e7", "#382914"],
    "--color-border-yellow": ["#fae5b9", "#523b1c"],
    "--color-icon-yellow": ["#b47818", "#f6b244"],
    "--color-text-yellow": ["#b47818", "#f6b244"],

    "--radius-none": "0px",
    "--radius-inner": "0.25rem",
    "--radius-element": "0.5rem",
    "--radius-container": "0.75rem",
    "--radius-page": "1.5rem",
    "--radius-full": "9999px",

    "--shadow-low": "0 2px 4px #0000000f, 0 4px 8px #0000001a",
    "--shadow-med": "0 2px 4px #0000000f, 0 4px 12px #0000001f",
    "--shadow-high": "0 4px 6px #0000001a, 0 12px 24px #00000033",
    "--shadow-inset-hover": "inset 0px 0px 0px 1.5px #c6282833",
    "--shadow-inset-selected": "inset 0px 0px 0px 2px #c6282880",
    "--shadow-inset-success": "inset 0px 0px 0px 1.5px #2e7d3233",
    "--shadow-inset-warning": "inset 0px 0px 0px 1.5px #b4781833",
    "--shadow-inset-error": "inset 0px 0px 0px 1.5px #c6282833",
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

    "progressbar-fill": {
      "variant:accent": {
        backgroundColor: "light-dark(#c62828, #e53935)",
      },
      "variant:success": {
        backgroundColor: "light-dark(#2e7d32, #81c784)",
      },
      "variant:warning": {
        backgroundColor: "light-dark(#b47818, #f6b244)",
      },
      "variant:error": {
        backgroundColor: "light-dark(#c62828, #ef5350)",
      },
    },

    "progressbar-track": {
      base: {
        backgroundColor: "var(--color-skeleton)",
      },
    },

    switch: {
      base: {
        "--color-background-gray": "var(--color-skeleton)",
      },
    },

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

  icons: appIconRegistry,
});
