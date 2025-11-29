import React from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'ghost' | 'purple';
  size?: 'small' | 'medium' | 'large';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  ariaLabel,
  className,
  disabled = false,
  variant = 'default',
  size = 'medium',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`}
    >
      {icon}
    </button>
  );
};

export default IconButton;

