import { FiHome, FiBriefcase, FiRefreshCw } from 'react-icons/fi';

export default function WorkStatusBadge({ status, showTooltip = true, size = 'sm' }) {
  // กำหนดสีและไอคอนตามสถานะ
  const getStatusDetails = () => {
    switch (status) {
      case 'WFH':
        return {
          icon: <FiHome className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'WFH',
          bgColor: 'bg-green-100 dark:bg-green-900/50',
          textColor: 'text-green-800 dark:text-green-400',
          tooltip: 'Work From Home'
        };
      case 'MIXED':
        return {
          icon: <FiRefreshCw className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'ผสม',
          bgColor: 'bg-purple-100 dark:bg-purple-900/50',
          textColor: 'text-purple-800 dark:text-purple-400',
          tooltip: 'ทำงานแบบผสม'
        };
      case 'OFFICE':
      default:
        return {
          icon: <FiBriefcase className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />,
          label: 'ออฟฟิศ',
          bgColor: 'bg-blue-100 dark:bg-blue-900/50',
          textColor: 'text-blue-800 dark:text-blue-400',
          tooltip: 'ทำงานที่ออฟฟิศ'
        };
    }
  };

  const { icon, label, bgColor, textColor, tooltip } = getStatusDetails();

  return (
    <div 
      className={`inline-flex items-center rounded-full ${bgColor} ${textColor} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}
      title={showTooltip ? tooltip : ''}
    >
      {icon}
      <span className={`ml-1 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{label}</span>
    </div>
  );
} 