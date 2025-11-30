import React, { useEffect, useRef } from 'react';
import styles from './DropdownList.module.css';

export interface DropdownItem {
  value: string;
  label: string;
}

export interface DropdownListProps {
  items: DropdownItem[];
  onSelect: (value: string) => void;
  searchValue?: string;
  className?: string;
  maxHeight?: number;
  position?: { top: number; left: number } | null;
}

export const DropdownList: React.FC<DropdownListProps> = ({
  items,
  onSelect,
  searchValue = '',
  className,
  maxHeight = 300,
  position,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && position) {
      listRef.current.style.top = `${position.top}px`;
      listRef.current.style.left = `${position.left}px`;
    }
  }, [position]);

  const filteredItems = searchValue
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchValue.toLowerCase())
      )
    : items;

  const handleItemClick = (value: string) => {
    onSelect(value);
  };

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className={`${styles.dropdownList} ${className || ''}`}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      {filteredItems.map((item) => (
        <div
          key={item.value}
          className={styles.item}
          onClick={() => handleItemClick(item.value)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleItemClick(item.value);
            }
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default DropdownList;

