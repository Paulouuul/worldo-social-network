// postcss.config.mjs
// Configuração do PostCSS com o plugin do Tailwind CSS.

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
