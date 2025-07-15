import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const alertConfig = {
  success: {
    bgColor: 'bg-neon-green bg-opacity-20',
    textColor: 'text-neon-green',
    borderColor: 'border-neon-green',
    shadowColor: 'shadow-glow-sm',
    icon: CheckCircle,
  },
  error: {
    bgColor: 'bg-red-600 bg-opacity-20',
    textColor: 'text-red-400',
    borderColor: 'border-red-400',
    shadowColor: 'shadow-glow-sm',
    icon: AlertCircle,
  },
  info: {
    bgColor: 'bg-neon-blue bg-opacity-20',
    textColor: 'text-neon-blue',
    borderColor: 'border-neon-blue',
    shadowColor: 'shadow-glow-sm',
    icon: Info,
  },
};

const Alert: React.FC<AlertProps> = ({ message, type = 'info' }) => {
  const config = alertConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`
      ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.shadowColor}
      border px-4 py-3 rounded-lg mb-3 text-center font-semibold text-sm 
      flex items-center justify-center gap-2 animate-fade-in
    `}
    >
      <IconComponent size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default Alert;
