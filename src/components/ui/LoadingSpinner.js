import React from 'react';

export function LoadingSpinner({ size = 'md', color = 'primary', className = '' }) {
  const sizeClass = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
  }[size] || 'loading-md';

  const colorClass = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  }[color] || 'text-primary';

  return (
    <span className={`loading loading-spinner ${sizeClass} ${colorClass} ${className}`}></span>
  );
}

export function LoadingPage({ message = 'กำลังโหลด...' }) {
  return (
    <div className="min-h-[200px] w-full flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-base-content/70">{message}</p>
    </div>
  );
}

export function LoadingButton({ loading, children, className = '', textClass = '', ...props }) {
  return loading ? <LoadingSpinner size="sm" /> : children;
}

export default LoadingSpinner; 