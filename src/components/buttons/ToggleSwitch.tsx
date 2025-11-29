import React from 'react';
import styles from './ToggleSwitch.module.css';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  id = 'extensionToggle',
  className,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  return (
    <label className={`${styles.toggleSwitch} ${className || ''}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className={styles.toggleSlider} />
    </label>
  );
};

export default ToggleSwitch;

