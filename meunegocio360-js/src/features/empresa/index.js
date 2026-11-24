import { lazy } from 'react';

// API pública da feature empresa (RNF-FE-01).
export { default as EmpresaProvider } from './context/EmpresaProvider.jsx';
export { default as RequireEmpresa } from './components/RequireEmpresa.jsx';
export { useEmpresa } from './hooks/useEmpresa.js';

// Páginas carregadas sob demanda (RNF-FE-05).
export const CadastroEmpresaPage = lazy(() => import('./pages/CadastroEmpresaPage.jsx'));
export const EmpresaPage = lazy(() => import('./pages/EmpresaPage.jsx'));
