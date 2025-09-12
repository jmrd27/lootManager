import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full rounded-md border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand-600',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export default Input;
