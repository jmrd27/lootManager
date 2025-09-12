import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900/60 p-4 shadow-sm">
    <table className={cn('w-full text-sm', className)} {...props} />
  </div>
);

export const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead {...props} />
);

export const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="divide-y divide-gray-800" {...props} />
);

export const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />;

export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('py-2 text-left font-semibold text-gray-200', className)} {...props} />
);

export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('py-2 text-gray-100', className)} {...props} />
);
