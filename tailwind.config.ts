import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink:'#26413c', sage:'#9eb7a1', mint:'#edf4ec', cream:'#fffaf2', coral:'#eaa38f', sun:'#f6d98b' }, fontFamily:{ sans:['var(--font-nunito)','ui-sans-serif','system-ui'] }, boxShadow:{ soft:'0 20px 60px rgba(38,65,60,.10)' } } }, plugins:[] };
export default config;
