import React from 'react';

export interface SpeakerIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  fill?: string;
}

export const SpeakerIcon: React.FC<SpeakerIconProps> = ({
  width = 14,
  height = 14,
  className,
  fill = 'white',
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
      <path d="M2 8v4h3l4 4V4L5 8H2z" fill={fill} />
      <path
        d="M13 7c.6.6 1 1.4 1 2.3s-.4 1.7-1 2.3"
        stroke={fill}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.5 4.5c1.2 1.2 2 2.8 2 4.6s-.8 3.4-2 4.6"
        stroke={fill}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default SpeakerIcon;

