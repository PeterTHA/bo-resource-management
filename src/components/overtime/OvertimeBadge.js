import { FiClock } from 'react-icons/fi';

export default function OvertimeBadge({ hours, status, showTooltip = true, size = 'sm' }) {
  // กำหนดสีตามสถานะ
  const getStatusDetails = () => {
    switch (status) {
      case 'อนุมัติ':
        return {
          bgColor: '',
          textColor: 'text-indigo-800 dark:text-indigo-400',
          tooltip: 'ทำงานล่วงเวลาที่อนุมัติแล้ว'
        };
      case 'ไม่อนุมัติ':
        return {
          bgColor: '',
          textColor: 'text-red-800 dark:text-red-400',
          tooltip: 'ทำงานล่วงเวลาที่ไม่อนุมัติ'
        };
      default:
        return {
          bgColor: '',
          textColor: 'text-yellow-800 dark:text-yellow-400',
          tooltip: 'ทำงานล่วงเวลาที่รออนุมัติ'
        };
    }
  };

  const { bgColor, textColor, tooltip } = getStatusDetails();

  return (
    <div 
      className={`inline-flex items-center rounded-full ${bgColor} ${textColor} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}
      title={showTooltip ? tooltip : ''}
    >
      <FiClock className={size === 'sm' ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'} />
      <span className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>OT {hours} ชม.</span>
    </div>
  );
} 