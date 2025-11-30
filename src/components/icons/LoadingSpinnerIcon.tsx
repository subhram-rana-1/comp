import React from 'react';

export interface LoadingSpinnerIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  stroke?: string;
}

export const LoadingSpinnerIcon: React.FC<LoadingSpinnerIconProps> = ({
  width = 24,
  height = 24,
  className,
  stroke = '#9F7BDB',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="2" fill="none" opacity="0.3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={stroke}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          dur="1s"
          repeatCount="indefinite"
          values="0 12 12;360 12 12"
        />
      </path>
    </svg>
  );
};

export default LoadingSpinnerIcon;

