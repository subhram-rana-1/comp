import React from 'react';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'top',
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {children}
      <div className={`${styles.tooltip} ${styles[position]}`}>
        {text}
      </div>
    </div>
  );
};

export default Tooltip;

