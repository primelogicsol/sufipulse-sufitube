module.exports = {
  content: [
    './public/**/*.html',
    './src/**/*.{js,ts,jsx,tsx,vue}',
  ],
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
  // ...
}