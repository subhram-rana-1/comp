import React from 'react';
import { LoadingSpinnerIcon } from '../icons';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  className,
  color,
}) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  return (
    <div className={`${styles.container} ${styles[size]} ${className || ''}`}>
      <LoadingSpinnerIcon width={sizeMap[size]} height={sizeMap[size]} stroke={color} />
    </div>
  );
};

export default Spinner;

