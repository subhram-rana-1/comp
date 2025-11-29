import React from 'react';

export interface ArrowRightIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  fill?: string;
}

export const ArrowRightIcon: React.FC<ArrowRightIconProps> = ({
  width = 20,
  height = 20,
  className,
  fill = '#9b59b6',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M8 6L8 2L10 2L16 8L10 14L8 14L8 10L-1.74845e-07 10L-3.01991e-07 6L8 6Z" fill={fill} />
    </svg>
  );
};

export default ArrowRightIcon;

