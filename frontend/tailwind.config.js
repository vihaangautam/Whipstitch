/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        "surface-container": "#F8FAFC",
        "surface-container-low": "#FFFFFF",
        "surface-container-high": "#F1F5F9",
        "surface-container-lowest": "#FFFFFF",
        "surface-elevated": "#FFFFFF",
        "on-surface": "#0F172A",
        "on-surface-variant": "#475569",
        "outline-variant": "#E2E8F0",
        outline: "#CBD5E1",
        border: "#E2E8F0",
        
        // Brand & System Tokens
        primary: "#0F172A",
        "primary-blue": "#2563EB",
        emerald: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
        },
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        lime: "#059669",
        charcoal: "#0F172A",
        error: "#DC2626",
      },
      borderRadius: {
        "DEFAULT": "0.375rem",
        "sm": "0.25rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        // Marketing pages: Familjen Grotesk sets headlines, Geist sets body.
        display: ["'Familjen Grotesk'", "Geist", "system-ui", "sans-serif"],
        geist: ["Geist", "system-ui", "sans-serif"],
        mono: ["'Geist Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
