import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef9f6',
          100: '#d5f2ea',
          200: '#aee4d5',
          300: '#79cfb8',
          400: '#44b397',
          500: '#26967c',  // Color primario FarmaFlow
          600: '#1c7861',
          700: '#196150',
          800: '#174e42',
          900: '#154038',
          950: '#0b2522',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
          muted: '#f1f5f9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}

export default config
