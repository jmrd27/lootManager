import React from 'react';
import { useLoot } from '@/features/loot/store';

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
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-[520px] divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr>
                <th className="py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Member</th>
                <th className="py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Total Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {names.map((n) => (
                <tr key={n}>
                  <td className="py-2 text-sm text-gray-800 dark:text-gray-100">{n}</td>
                  <td className="py-2 text-sm text-gray-800 dark:text-gray-100">{summary[n]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs opacity-70">Leaders assign items; everyone can view totals here.</p>
    </div>
  );
};

