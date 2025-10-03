module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#4F46E5',
        },
        accent: '#06B6D4',
        muted: '#6B7280',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      lineClamp: {
        3: '3',
        5: '5',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
  variants: {
    extend: {
      lineClamp: ['responsive', 'hover'],
    },
  },
};
