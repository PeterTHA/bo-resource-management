export function Card({ children, className = "" }) {
  return (
    <div 
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-lg font-bold text-gray-800 ${className}`}>
      {children}
    </h3>
  );
}

export function CardHeader({ children, title, subtitle, icon, className = "" }) {
  return (
    <div 
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
    >
      {children || (
        <div className="flex items-center">
          {icon && <div className="mr-3 text-primary text-xl">{icon}</div>}
          <div>
            {title && <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }) {
  return (
    <div 
      className={`flex items-center p-6 pt-0 ${className}`}
    >
      {children}
    </div>
  );
} 