import { FiHome, FiBriefcase, FiRefreshCw, FiCoffee } from 'react-icons/fi';

export default function WorkStatusBadge({ status, size = 'md' }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'WFH':
        return {
          icon: FiHome,
          text: 'ทำงานที่บ้าน',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-200 dark:border-green-700'
        };
      case 'OFFICE':
        return {
          icon: FiBriefcase,
          text: 'ทำงานที่ออฟฟิศ',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-200 dark:border-blue-700'
        };
      case 'HYBRID':
        return {
          icon: FiRefreshCw,
          text: 'แบบผสม',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-800 dark:text-purple-200',
          borderColor: 'border-purple-200 dark:border-purple-700'
        };
      case 'OFFSITE':
        return {
          icon: FiCoffee,
          text: 'นอกสถานที่',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-800 dark:text-amber-200',
          borderColor: 'border-amber-200 dark:border-amber-700'
        };
      default:
        return {
          icon: FiBriefcase,
          text: 'ไม่ระบุ',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-800 dark:text-gray-200',
          borderColor: 'border-gray-200 dark:border-gray-700'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}>
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      <span>{config.text}</span>
    </div>
  );
} 