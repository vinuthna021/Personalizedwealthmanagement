import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-wealth-card border border-wealth-border rounded-xl shadow-2xl overflow-hidden p-6 text-wealth-textPrimary z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-wealth-border mb-4">
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-wealth-textSecondary hover:text-wealth-textPrimary"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content Body */}
        <div>{children}</div>
      </div>
    </div>
  );
};
