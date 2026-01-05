import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm',
                        'bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100',
                        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                        'focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400',
                        'px-4 py-2.5 border transition-colors',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>}
                {helperText && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
