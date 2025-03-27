export const statuses = [
  {
    key: 'all',
    value: undefined,
    label: 'All',
  },
  {
    key: 'in',
    value: 'IN' as const,
    label: 'Received',
  },
  {
    key: 'out',
    value: 'OUT' as const,
    label: 'Sent',
  },
  {
    key: 'pending',
    value: 'PENDING' as const,
    label: 'Pending',
  },
];
export type Status = (typeof statuses)[number];
export type StatusValue = Status['value'];
