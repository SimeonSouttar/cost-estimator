import React from 'react';
import styles from './Button.module.css';

export default function Button({
    children,
    variant = 'primary', // primary, secondary, danger, ghost
    onClick,
    type = 'button',
    className = '',
    disabled = false
}) {
    return (
        <button
            type={type}
            className={`${styles.btn} ${styles[variant]} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
