export function Card({ children, className = "" }) {
  return (
    <div 
      className={`card bg-base-100 shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon }) {
  return (
    <div 
      className="card-title p-6 bg-base-200 border-b border-base-300"
    >
      <div className="flex items-center">
        {icon && <div className="mr-3 text-primary text-xl">{icon}</div>}
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }) {
  return (
    <div 
      className={`card-actions justify-end p-6 bg-base-200 border-t border-base-300 ${className}`}
    >
      {children}
    </div>
  );
} 