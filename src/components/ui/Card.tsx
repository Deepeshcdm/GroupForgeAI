import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
    return (
        <div
            className={cn(
                'bg-white dark:bg-gray-900/80 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/60 overflow-hidden backdrop-blur-sm',
                hover && 'hover:shadow-lg dark:hover:shadow-primary-500/5 hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-b border-gray-100 dark:border-gray-800/60', className)}>
            {children}
        </div>
    );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800/60', className)}>
            {children}
        </div>
    );
}
