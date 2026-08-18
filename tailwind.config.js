/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0F",
        surface: "#12121A",
        elevated: "#1A1A26",
        glass: "rgba(18, 18, 26, 0.72)",
        "glass-border": "rgba(255, 255, 255, 0.06)",
        primary: {
          DEFAULT: "#6366F1",
          hover: "#818CF8",
          glow: "rgba(99, 102, 241, 0.35)",
        },
        premium: {
          DEFAULT: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.3)",
        },
        success: "#10B981",
        danger: "#EF4444",
        muted: "#5C5C70",
      },
      fontFamily: {
        heading: ["'Outfit Variable'", "system-ui", "sans-serif"],
        body: ["'Inter Variable'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "12px",
        button: "10px",
        modal: "20px",
        poster: "8px",
        badge: "6px",
        input: "10px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover":
          "0 12px 48px rgba(99, 102, 241, 0.15), 0 4px 24px rgba(0, 0, 0, 0.5)",
        modal: "0 24px 80px rgba(0, 0, 0, 0.6)",
        "nav-bar":
          "0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 32px rgba(0, 0, 0, 0.3)",
      },
      letterSpacing: {
        hero: "-0.03em",
        section: "-0.02em",
        card: "-0.01em",
      },
    },
  },
  plugins: [],
};
