'use client';
import { useEffect } from 'react';

export function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div
        className="relative bg-paper border border-ink/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
