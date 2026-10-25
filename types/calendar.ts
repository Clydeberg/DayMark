export type ItemType = "TASK" | "EVENT" | "MEETING" | "DEADLINE";
export type ItemStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type Person = {
  id: string;
  name: string;
  email: string;
};

export type CalendarItem = {
  id: string;
  title: string;
  description: string | null;
  type: ItemType;
  status: ItemStatus;
  priority: Priority;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  ownerId: string;
  assigneeId: string | null;
  assignee: Person | null;
  owner: Person;
  createdAt: string;
  updatedAt: string;
};

export type ItemFormValues = {
  title: string;
  description: string;
  type: ItemType;
  status: ItemStatus;
  priority: Priority;
  startAt: string;
  endAt: string;
  allDay: boolean;
  assigneeId: string;
};
