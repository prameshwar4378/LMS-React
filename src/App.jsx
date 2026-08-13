import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoadingProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </LoadingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
