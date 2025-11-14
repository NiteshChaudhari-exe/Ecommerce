import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const showToast = (message, severity = 'info', duration = 3000) => {
    setToast({ open: true, message, severity });
    if (duration > 0) setTimeout(() => setToast((t) => ({ ...t, open: false })), duration);
  };

  const handleClose = () => setToast((t) => ({ ...t, open: false }));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.showToast;
};

export default ToastProvider;
