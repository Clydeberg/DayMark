import { z } from "zod";

const itemFields = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2_000).optional().nullable(),
  type: z.enum(["TASK", "EVENT", "MEETING", "DEADLINE"]),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  startAt: z.iso.datetime({ offset: true }),
  endAt: z.iso.datetime({ offset: true }).optional().nullable(),
  allDay: z.boolean().default(false),
  assigneeId: z.string().min(1).optional().nullable(),
});

function checkDateOrder(
  value: { startAt?: string; endAt?: string | null },
  context: z.RefinementCtx,
) {
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
  assigneeId: z.string().min(1).optional(),
});
