import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { AuthProvider, SessionGate } from '../features/auth/index.js';
import { EmpresaProvider } from '../features/empresa/index.js';
import AppRoutes from './AppRoutes.jsx';
import { queryClient } from './query-client.js';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SessionGate>
            <EmpresaProvider>
              <AppRoutes />
            </EmpresaProvider>
          </SessionGate>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
