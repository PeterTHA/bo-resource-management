export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon }) {
  return (
    <div className="px-6 py-4 bg-primary-200 border-b border-primary-300">
      <div className="flex items-center">
        {icon && <div className="mr-3 text-primary-700 text-xl">{icon}</div>}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-700">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`px-6 py-3 bg-gray-100 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
} 