// Declarações para arquivos CSS
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Declarações para outros assets (se necessário)
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module '*.webp';
