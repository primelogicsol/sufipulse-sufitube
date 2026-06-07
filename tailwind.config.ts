module.exports = {
  content: [
    './public/**/*.html',
    './src/**/*.{js,ts,jsx,tsx,vue}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
  // ...
}