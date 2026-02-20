export const theme = {
  colors: {
    // Primary - Forest greens
    primary: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#16a34a",
      600: "#15803d",
      700: "#166534",
      800: "#14532d",
      900: "#052e16",
    },
    // Accent - Warm amber/campfire orange
    accent: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
    },
    // Neutral - Stone grays
    stone: {
      50: "#fafaf9",
      100: "#f5f5f4",
      200: "#e7e5e4",
      300: "#d6d3d1",
      400: "#a8a29e",
      500: "#78716c",
      600: "#57534e",
      700: "#44403c",
      800: "#292524",
      900: "#1c1917",
    },
    // Semantic
    success: "#16a34a",
    warning: "#f59e0b",
    error: "#dc2626",
    info: "#2563eb",
    // Background
    background: "#fafaf9",
    surface: "#ffffff",
    surfaceHover: "#f5f5f4",
  },
  fonts: {
    heading: "PlusJakartaSans-Bold",
    body: "PlusJakartaSans-Regular",
    mono: "JetBrainsMono-Regular",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
} as const;
