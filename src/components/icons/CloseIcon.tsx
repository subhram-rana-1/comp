import React from 'react';

export interface CloseIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  variant?: 'purple' | 'white';
}

export const CloseIcon: React.FC<CloseIconProps> = ({
  width = 12,
  height = 12,
  className,
  stroke,
  strokeWidth = 1.8,
  variant = 'purple',
}) => {
  const strokeColor = stroke || (variant === 'purple' ? '#9527F5' : '#A020F0');
  const viewBox = variant === 'white' ? '0 0 24 24' : '0 0 12 12';
  const finalStrokeWidth = variant === 'white' ? 3.5 : strokeWidth;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {variant === 'white' ? (
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke={strokeColor}
          strokeWidth={finalStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M2 2L10 10M10 2L2 10"
          stroke={strokeColor}
          strokeWidth={finalStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

export default CloseIcon;

