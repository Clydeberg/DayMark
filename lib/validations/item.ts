import { z } from "zod";

const itemFields = z.object({
  title: z.string({ error: "Title is required" }).trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2_000).optional().nullable(),
  type: z.enum(["TASK", "EVENT", "MEETING", "DEADLINE"], { error: "Type is required" }),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"], { error: "Status is required" }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"], { error: "Priority is required" }),
  startAt: z.iso.datetime({ offset: true, error: "Start time is required" }),
  endAt: z.iso.datetime({ offset: true, error: "Enter a valid end time" }).optional().nullable(),
  allDay: z.boolean().default(false),
  assigneeId: z.string().trim().min(1).optional(),
});

function checkDateOrder(
  value: { type?: string; startAt?: string; endAt?: string | null },
  context: z.RefinementCtx,
) {
  if (value.type === "DEADLINE" && !value.endAt) {
    context.addIssue({
      code: "custom",
      path: ["endAt"],
      message: "Deadline date is required",
    });
  }
  if (value.startAt && value.endAt && new Date(value.endAt) < new Date(value.startAt)) {
    context.addIssue({
      code: "custom",
      path: ["endAt"],
      message: "End time must be after the start time",
    });
  }
}

export const createItemSchema = itemFields.superRefine(checkDateOrder);
export const updateItemSchema = itemFields.partial().superRefine(checkDateOrder);

export const itemRangeSchema = z.object({
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }),
  type: z.enum(["TASK", "EVENT", "MEETING", "DEADLINE"]).optional(),
});
