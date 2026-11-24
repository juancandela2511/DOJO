/**
 * @file tailwind.config.js
 * @description Configuración de Tailwind CSS con los tokens exactos del Apple Style Reference
 *              ("Cinema on White" — Chinese Kung Fu Edition).
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'gallery-white': '#fafafc',
        'cloud-gray': '#f5f5f7',
        'studio-white': '#ffffff',
        'graphite': '#1d1d1f',
        'slate': '#5b5b61',
        'steel': '#86868b',
        'divider-gray': '#d6d6d6',
        'control-mist': '#e2e2e5',
        'apple-blue': '#0071e3',
        'link-blue': '#0066cc',
        'new-orange': '#b64400',
      },
      fontFamily: {
        display: [
          'SF Pro Display',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        text: [
          'SF Pro Text',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        'apple-card': '28px',
        'apple-media': '20px',
        'apple-capsule': '36px',
        'apple-pill': '9999px',
      },
    },
  },
  plugins: [],
};
