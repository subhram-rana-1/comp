import React, { useState, useRef, useEffect } from 'react';
import { IconButton } from '../buttons';
import { Tooltip } from './Tooltip';
import styles from './Menu.module.css';

export interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tooltip?: string;
}

export interface MenuProps {
  items: MenuItem[];
  triggerIcon: React.ReactNode;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const Menu: React.FC<MenuProps> = ({
  items,
  triggerIcon,
  className,
  position = 'top-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`${styles.container} ${className || ''}`}>
      <IconButton
        icon={triggerIcon}
        onClick={() => setIsOpen(!isOpen)}
        ariaLabel="Open menu"
        variant="ghost"
      />
      {isOpen && (
        <div className={`${styles.menu} ${styles[position]}`}>
          {items.map((item) => {
            const menuItem = (
              <button
                key={item.id}
                className={styles.menuItem}
                onClick={() => handleItemClick(item)}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </button>
            );

            return item.tooltip ? (
              <Tooltip key={item.id} text={item.tooltip} position="left">
                {menuItem}
              </Tooltip>
            ) : (
              menuItem
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Menu;

