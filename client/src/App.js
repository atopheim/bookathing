import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminPage from './pages/AdminPage';
import EmbedPage from './pages/EmbedPage';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/embed/:resourceId?" element={<EmbedPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="book/:resourceId" element={<BookingPage />} />
          <Route path="confirmation/:bookingId" element={<ConfirmationPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
