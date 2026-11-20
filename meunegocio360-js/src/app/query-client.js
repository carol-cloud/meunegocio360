import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (tentativas, erro) => erro?.status >= 500 && tentativas < 2,
      refetchOnWindowFocus: false,
    },
  },
});
