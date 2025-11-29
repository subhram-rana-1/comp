import React from 'react';

export interface SparkleIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  stroke?: string;
}

export const SparkleIcon: React.FC<SparkleIconProps> = ({
  width = 20,
  height = 20,
  className,
  stroke = '#D8B4FE',
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
      <path
        d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default SparkleIcon;

