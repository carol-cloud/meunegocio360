import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import {
  HomePage,
  LoginPage,
  PublicOnly,
  RequireAuth,
  RequireRole,
} from '../features/auth/index.js';
import { CadastroEmpresaPage, EmpresaPage, RequireEmpresa } from '../features/empresa/index.js';
import { PERFIS } from '../shared/lib/perfis.js';
import PageLoader from '../shared/ui/PageLoader.jsx';
import AppLayout from './AppLayout.jsx';

const NotFoundPage = lazy(() => import('../shared/ui/NotFoundPage.jsx'));

// Rotas protegidas dentro do AppLayout (RF-FE-002). RequireAuth garante a sessão,
// RequireRole o perfil e RequireEmpresa a empresa ativa (apenas UX; o backend autoriza).
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route element={<RequireRole perfis={[PERFIS.ADMIN]} />}>
            <Route path="/empresa/cadastro" element={<CadastroEmpresaPage />} />
          </Route>
          <Route element={<RequireEmpresa />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/empresa" element={<EmpresaPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
