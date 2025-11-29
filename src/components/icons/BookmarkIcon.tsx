import React from 'react';

export interface BookmarkIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  filled?: boolean;
  stroke?: string;
  fill?: string;
}

export const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  width = 20,
  height = 20,
  className,
  filled = false,
  stroke,
  fill,
}) => {
  const strokeColor = stroke || (filled ? '#A020F0' : '#D8B4FE');
  const fillColor = fill || (filled ? '#A020F0' : 'none');

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
        d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fillColor}
      />
    </svg>
  );
};

export default BookmarkIcon;

