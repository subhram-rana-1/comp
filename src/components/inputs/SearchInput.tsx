import React, { useState, forwardRef } from 'react';
import styles from './SearchInput.module.css';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  onFocus,
  onBlur,
  disabled = false,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  return (
    <div className={`${styles.container} ${className || ''} ${isFocused ? styles.focused : ''}`}>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={styles.input}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;

