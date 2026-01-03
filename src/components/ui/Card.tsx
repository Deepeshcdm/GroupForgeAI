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
                'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
                hover && 'hover:shadow-md transition-shadow cursor-pointer',
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
        <div className={cn('px-6 py-4 border-b border-gray-100', className)}>
            {children}
        </div>
    );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 bg-gray-50 border-t border-gray-100', className)}>
            {children}
        </div>
    );
}
