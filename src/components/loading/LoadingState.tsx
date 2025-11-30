import React from 'react';
import { Spinner } from './Spinner';
import styles from './LoadingState.module.css';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Page is loading',
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.icon}>
        <Spinner size="medium" />
      </div>
      <p className={styles.text}>{message}</p>
    </div>
  );
};

export default LoadingState;

