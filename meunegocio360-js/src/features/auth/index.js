import { lazy } from 'react';

// API pública da feature de autenticação (RNF-FE-01).
export { default as AuthProvider } from './context/AuthProvider.jsx';
export { default as SessionGate } from './components/SessionGate.jsx';
export { default as RequireAuth } from './components/RequireAuth.jsx';
export { default as PublicOnly } from './components/PublicOnly.jsx';
export { default as RequireRole } from './components/RequireRole.jsx';
export { useLogout } from './hooks/useLogout.js';
export { useAuth } from './hooks/useAuth.js';

// Páginas carregadas sob demanda (RNF-FE-05).
export const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
export const HomePage = lazy(() => import('./pages/HomePage.jsx'));
