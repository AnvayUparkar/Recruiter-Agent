/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          muted: "var(--accent-muted)",
        },
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
        },
        border: "var(--border)",
        glass: {
          bg: "var(--glass)",
          border: "var(--glass-border)",
        },
        // Static semantic scale definitions
        brandBlue: "#4F7CFF",
        brandPurple: "#A855F7",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#F43F5E",
        info: "#0EA5E9",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
        neon: "var(--shadow-neon)",
        glass: "var(--shadow-glass)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        medium: "var(--duration-medium)",
        slow: "var(--duration-slow)",
        hero: "var(--duration-hero)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
    },
  },
  plugins: [],
}
