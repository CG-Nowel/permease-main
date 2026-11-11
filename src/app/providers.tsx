import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '../store/AuthContext.tsx';
import { AcademicTermProvider } from '../store/AcademicTermContext.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AcademicTermProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AcademicTermProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

