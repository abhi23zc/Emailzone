import { ReactNode } from 'react';
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up ${className}`}>
      {children}
    </div>
  );
}
