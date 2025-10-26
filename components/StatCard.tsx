import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  isPositive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, isPositive }) => {
  const valueColor = isPositive === undefined
    ? 'text-cyan-600 dark:text-cyan-400'
    : isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col items-center text-center sm:items-start sm:text-right">
      <div className="flex items-center gap-4 w-full">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            {icon}
          </div>
          <div>
            <h4 className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</h4>
            <p className={`text-xl sm:text-2xl font-bold ${valueColor}`}>{value}</p>
          </div>
      </div>
    </div>
  );
};

export default StatCard;