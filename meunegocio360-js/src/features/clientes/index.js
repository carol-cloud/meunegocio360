import { lazy } from 'react';

// API pública da feature clientes (RNF-FE-01). Telas futuras (vendas, OS) usam o ClienteSelect
// e nunca recriam a busca.
export { default as ClienteSelect } from './components/ClienteSelect.jsx';
export { useBuscaClientes } from './hooks/useBuscaClientes.js';

// Páginas carregadas sob demanda (RNF-FE-05).
export const ClientesPage = lazy(() => import('./pages/ClientesPage.jsx'));
export const ClienteFormPage = lazy(() => import('./pages/ClienteFormPage.jsx'));
export const ClienteSelectDemoPage = lazy(() => import('./pages/ClienteSelectDemoPage.jsx'));
