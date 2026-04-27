import { FlatCompat } from '@eslint/eslintrc';
import nextVitals from 'eslint-config-next/core-web-vitals.js';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  ...compat.config(nextVitals),
  {
    ignores: ['.next/**', 'node_modules/**', 'public/uploads/**', 'prisma/**'],
    rules: {
      '@next/next/no-img-element': 'off',
      '@next/next/no-page-custom-font': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'import/no-anonymous-default-export': 'off',
      'react/jsx-no-comment-textnodes': 'off',
    },
  },
];

export default config;
