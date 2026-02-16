import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { ThemeProvider } from '@/lib/theme';
import { AdminPage } from '@/pages/AdminPage';
import { MobilePage } from '@/pages/MobilePage';
import { IpadPage } from '@/pages/IpadPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/admin/:section' element={<AdminPage />} />
          <Route path='/employee/mobile' element={<MobilePage />} />
          <Route path='/employee/ipad' element={<IpadPage />} />
          <Route path='*' element={<Navigate to='/admin/overview' replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
