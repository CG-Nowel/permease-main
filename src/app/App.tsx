import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers.tsx';
import { AppRoutes } from './router.tsx';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
