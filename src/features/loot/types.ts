export type Item = {
  id: string;
  name: string;
  quantity: number;
  dateISO: string; // YYYY-MM-DD
  createdAt?: string;
  position?: number;
};

export type Request = {
  id: string;
  itemId: string;
  memberName: string;
  quantity: number; // requested units
  createdAt: string; // ISO timestamp
  requesterId?: string;
};

export type ItemAlloc = {
  assignments: { memberName: string; qty: number }[];
  leftover: number;
};

export type Assignment = {
  id: string;
  itemId: string;
  assigneeId?: string;
  assigneeName: string;
  quantity: number;
  assignedBy?: string;
  createdAt: string;
};
