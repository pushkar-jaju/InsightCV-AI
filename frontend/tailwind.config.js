/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── DESIGN.md Design Tokens ──────────────────────────────
        // Brand & Accent
        primary:        '#f54e00',
        'primary-active': '#d04200',
        'on-primary':   '#ffffff',

        // Text
        ink:            '#26251e',
        'body-text':    '#5a5852',
        muted:          '#807d72',
        'muted-soft':   '#a09c92',

        // Surfaces
        canvas:         '#f7f7f4',
        'canvas-soft':  '#fafaf7',
        'surface-card': '#ffffff',
        'surface-strong': '#e6e5e0',

        // Hairlines
        hairline:       '#e6e5e0',
        'hairline-soft': '#efeee8',
        'hairline-strong': '#cfcdc4',

        // Semantic
        'semantic-success': '#1f8a65',
        'semantic-error':   '#cf2d56',

        // AI Timeline pastels (in-product agent timeline only)
        'timeline-thinking': '#dfa88f',
        'timeline-grep':     '#9fc9a2',
        'timeline-read':     '#9fbbe0',
        'timeline-edit':     '#c0a8dd',
        'timeline-done':     '#c08532',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        // Display scale (weight 400, negative letter-spacing)
        'display-mega': ['72px', { lineHeight: '1.1', letterSpacing: '-2.16px', fontWeight: '400' }],
        'display-lg':   ['36px', { lineHeight: '1.2', letterSpacing: '-0.72px', fontWeight: '400' }],
        'display-md':   ['26px', { lineHeight: '1.25', letterSpacing: '-0.325px', fontWeight: '400' }],
        'display-sm':   ['22px', { lineHeight: '1.3', letterSpacing: '-0.11px', fontWeight: '400' }],
        // Title scale
        'title-md':     ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'title-sm':     ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        // Body scale
        'body-md':      ['16px', { lineHeight: '1.5' }],
        'body-tracked': ['16px', { lineHeight: '1.5', letterSpacing: '0.08px' }],
        'body-sm':      ['14px', { lineHeight: '1.5' }],
        // Caption scale
        'caption':         ['13px', { lineHeight: '1.4' }],
        'caption-upper':   ['11px', { lineHeight: '1.4', letterSpacing: '0.88px', fontWeight: '600' }],
        // Code
        'code':         ['13px', { lineHeight: '1.5' }],
        // Button
        'btn':          ['14px', { lineHeight: '1.0', fontWeight: '500' }],
        // Nav
        'nav':          ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'pill': '9999px',
      },
      spacing: {
        'xxs':     '4px',
        'xs':      '8px',
        'sm-sp':   '12px',
        'base':    '16px',
        'md-sp':   '20px',
        'lg-sp':   '24px',
        'xl-sp':   '32px',
        'xxl':     '48px',
        'section': '80px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'shake':      'shake 0.4s ease-out',
        'shimmer':    'shimmer 1.5s ease-in-out infinite',
        'spin-slow':  'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-8px)' },
          '40%':      { transform: 'translateX(8px)' },
          '60%':      { transform: 'translateX(-6px)' },
          '80%':      { transform: 'translateX(6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
