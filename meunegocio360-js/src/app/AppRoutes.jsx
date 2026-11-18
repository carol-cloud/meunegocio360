import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { HomePage, LoginPage, PublicOnly, RequireAuth } from '../features/auth/index.js';
import PageLoader from '../shared/ui/PageLoader.jsx';

const NotFoundPage = lazy(() => import('../shared/ui/NotFoundPage.jsx'));

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
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
