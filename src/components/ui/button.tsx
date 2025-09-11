import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-brand-600 text-white hover:bg-brand-500 border-transparent',
  secondary:
    'bg-gray-900/5 text-gray-900 hover:bg-gray-900/10 dark:text-gray-100 dark:bg-gray-50/10 dark:hover:bg-gray-50/15 border border-gray-300 dark:border-gray-700',
  outline:
    'bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700',
  destructive:
    'bg-red-600 text-white hover:bg-red-500 border-transparent',
  ghost:
    'bg-transparent hover:bg-gray-900/5 dark:hover:bg-gray-50/10 text-inherit border-transparent',
  link:
    'bg-transparent text-brand-600 hover:underline border-transparent',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-sm',
  icon: 'h-9 w-9 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1 rounded-md font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
          'ring-offset-white dark:ring-offset-gray-900 focus-visible:ring-brand-600',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export default Button;

