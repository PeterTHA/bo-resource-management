import React from 'react';

export function LoadingSpinner({ size = 'md', color = 'primary', className = '' }) {
  const sizeClass = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }[size] || 'h-6 w-6';

  const colorClass = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-destructive',
    white: 'text-white',
    foreground: 'text-foreground',
    muted: 'text-muted-foreground',
  }[color] || 'text-primary';

  return (
    <svg 
      className={`animate-spin ${sizeClass} ${colorClass} ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

export function LoadingPage({ message = 'กำลังโหลด...' }) {
  return (
    <div className="min-h-[200px] w-full flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

export function LoadingButton({ loading, children, className = '', textClass = '', ...props }) {
  return (
    <button
      className={`${className} ${loading ? 'relative' : ''}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="sm" color="white" />
          </span>
        </>
      ) : children}
    </button>
  );
}

export default LoadingSpinner; 