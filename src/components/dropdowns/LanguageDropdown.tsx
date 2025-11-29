import React, { useState, useRef, useEffect } from 'react';
import { SearchInput } from '../inputs';
import { ChevronDownIcon } from '../icons';
import { DropdownList, DropdownItem } from './DropdownList';
import styles from './LanguageDropdown.module.css';

export interface LanguageDropdownProps {
  value: string;
  onChange: (value: string) => void;
  languages: DropdownItem[];
  className?: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  value,
  onChange,
  languages,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchValue('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchValue('');
  };

  const selectedLanguage = languages.find((lang) => lang.value === value);

  return (
    <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
      <div className={styles.inputContainer}>
        <SearchInput
          ref={inputRef}
          value={searchValue}
          onChange={setSearchValue}
          onFocus={handleInputFocus}
          placeholder={selectedLanguage?.label || 'Select language...'}
          className={styles.searchInput}
        />
        <div className={styles.iconContainer}>
          <ChevronDownIcon
            width={20}
            height={20}
            stroke="#666"
            className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
          />
        </div>
      </div>
      {isOpen && (
        <DropdownList
          items={languages}
          onSelect={handleSelect}
          searchValue={searchValue}
          position={dropdownPosition}
          className={styles.dropdown}
        />
      )}
    </div>
  );
};

export default LanguageDropdown;

