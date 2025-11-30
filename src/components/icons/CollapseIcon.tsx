import React from 'react';

export interface CollapseIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  fill?: string;
}

export const CollapseIcon: React.FC<CollapseIconProps> = ({
  width = 20,
  height = 20,
  className,
  fill = '#666',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CollapseIcon;

