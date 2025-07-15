import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const base = 'px-4 py-2 rounded font-medium focus:outline-none transition';
const variants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}) => {
  const style = disabled ? variants.disabled : variants[variant];
  return (
    <button className={`${base} ${style} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
