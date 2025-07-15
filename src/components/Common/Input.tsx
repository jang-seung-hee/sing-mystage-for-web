import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input: React.FC<InputProps> = ({ error, className = '', ...props }) => (
  <input
    className={`p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
    {...props}
  />
);

export default Input;
