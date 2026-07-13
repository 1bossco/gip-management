/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand — deep government blue
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Status colors
        complete:    { DEFAULT: "#10b981", light: "#d1fae5" },
        incomplete:  { DEFAULT: "#f59e0b", light: "#fef3c7" },
        approved:    { DEFAULT: "#10b981", light: "#d1fae5" },
        disapproved: { DEFAULT: "#ef4444", light: "#fee2e2" },
        pending:     { DEFAULT: "#0ea5e9", light: "#e0f2fe" },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace"],
      },
    },
  },
  plugins: [],
};
