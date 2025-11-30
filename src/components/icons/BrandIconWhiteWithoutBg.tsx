import React from 'react';

export interface BrandIconWhiteWithoutBgProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const BrandIconWhiteWithoutBg: React.FC<BrandIconWhiteWithoutBgProps> = ({
  width = 20,
  height = 20,
  className,
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
      {/* Outer ring/oval - white thick border */}
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="9"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner four-pointed star - white */}
      <path
        d="M12 6L13.5 9.5L17 10.5L13.5 11.5L12 15L10.5 11.5L7 10.5L10.5 9.5L12 6Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
    </svg>
  );
};

export default BrandIconWhiteWithoutBg;


