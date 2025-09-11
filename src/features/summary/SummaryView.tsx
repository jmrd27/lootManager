import React from 'react';
import { useLoot } from '@/features/loot/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const SummaryView: React.FC = () => {
  const { assignments } = useLoot();
  const summary: Record<string, number> = {};
  for (const a of assignments) summary[a.assigneeName] = (summary[a.assigneeName] || 0) + a.quantity;
  const names = Object.keys(summary).sort();

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Assignments Summary</h2>
      {names.length === 0 ? (
        <p className="text-sm opacity-80">No assignments yet.</p>
      ) : (
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm">Member</TableHead>
              <TableHead className="text-sm">Total Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {names.map((n) => (
              <TableRow key={n}>
                <TableCell>{n}</TableCell>
                <TableCell>{summary[n]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <p className="mt-2 text-xs opacity-70">Leaders assign items; everyone can view totals here.</p>
    </div>
  );
};
