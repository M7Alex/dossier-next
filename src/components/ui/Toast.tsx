'use client';
import { Toaster } from 'sonner';

export default function Toast() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'rgba(8,12,18,0.96)',
          border: '1px solid rgba(201,168,76,0.28)',
          color: '#C9A84C',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: '9px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        },
      }}
    />
  );
}
