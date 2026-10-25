"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { localInputToUtc, toLocalInputValue } from "@/lib/dates";
import type { CalendarItem, ItemFormValues, Person } from "@/types/calendar";

type SaveValues = Omit<ItemFormValues, "startAt" | "endAt"> & {
  startAt: string;
  endAt: string | null;
};

type ItemFormProps = {
  item: CalendarItem | null;
  initialDate: string;
  users: Person[];
  onSave: (values: SaveValues) => Promise<void>;
  onCancel: () => void;
};

function defaults(item: CalendarItem | null, initialDate: string): ItemFormValues {
  if (item) {
    return {
      title: item.title,
      description: item.description ?? "",
      type: item.type,
      status: item.status,
      priority: item.priority,
      startAt: toLocalInputValue(item.startAt),
      endAt: item.endAt ? toLocalInputValue(item.endAt) : "",
      allDay: item.allDay,
      assigneeId: item.assigneeId ?? "",
    };
  }

  const start = new Date(initialDate);
  if (start.getHours() === 0 && start.getMinutes() === 0) start.setHours(9);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    title: "",
    description: "",
    type: "TASK",
    status: "TODO",
    priority: "MEDIUM",
    startAt: toLocalInputValue(start),
    endAt: toLocalInputValue(end),
    allDay: false,
    assigneeId: "",
  };
}

export function ItemForm({ item, initialDate, users, onSave, onCancel }: ItemFormProps) {
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({ defaultValues: defaults(item, initialDate) });

  useEffect(() => {
    reset(defaults(item, initialDate));
  }, [item, initialDate, reset]);

  return (
    <form
      className="grid gap-5 sm:grid-cols-2"
      onSubmit={handleSubmit(async (values) => {
        setServerError("");
        try {
          await onSave({
            ...values,
            startAt: localInputToUtc(values.startAt),
            endAt: values.endAt ? localInputToUtc(values.endAt) : null,
          });
        } catch (error) {
          setServerError(error instanceof Error ? error.message : "Could not save the item.");
        }
      })}
    >
      <label className="sm:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Title *</span>
        <input autoFocus {...register("title", { required: "Title is required", maxLength: 120 })} className="field" placeholder="What needs to happen?" />
        {errors.title ? <span className="field-error">{errors.title.message}</span> : null}
      </label>

      <label className="sm:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Description</span>
        <textarea {...register("description", { maxLength: 2000 })} rows={4} className="field min-h-28 resize-y py-3" placeholder="Add useful details, notes, or an agenda…" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-semibold text-slate-700">Type *</span>
        <select {...register("type")} className="field">
          <option value="TASK">Task</option><option value="EVENT">Event</option><option value="MEETING">Meeting</option><option value="DEADLINE">Deadline</option>
        </select>
      </label>
      <label>
        <span className="mb-2 block text-sm font-semibold text-slate-700">Status *</span>
        <select {...register("status")} className="field">
          <option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option>
        </select>
      </label>
      <label>
        <span className="mb-2 block text-sm font-semibold text-slate-700">Priority *</span>
        <select {...register("priority")} className="field">
          <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
        </select>
      </label>
      <label>
        <span className="mb-2 block text-sm font-semibold text-slate-700">Assignee</span>
        <select {...register("assigneeId")} className="field">
          <option value="">Unassigned</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
      </label>
      <label>
        <span className="mb-2 block text-sm font-semibold text-slate-700">Starts *</span>
        <input type="datetime-local" {...register("startAt", { required: "Start time is required" })} className="field" />
        {errors.startAt ? <span className="field-error">{errors.startAt.message}</span> : null}
      </label>
      <label>
        <span className="mb-2 block text-sm font-semibold text-slate-700">Ends</span>
        <input type="datetime-local" {...register("endAt", { validate: (value) => !value || !getValues("startAt") || value >= getValues("startAt") || "End must be after start" })} className="field" />
        {errors.endAt ? <span className="field-error">{errors.endAt.message}</span> : null}
      </label>
      <label className="flex items-center gap-3 sm:col-span-2">
        <input type="checkbox" {...register("allDay")} className="size-4 accent-blue-600" />
        <span className="text-sm font-semibold text-slate-700">All-day item</span>
      </label>

      {serverError ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{serverError}</p> : null}

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
        <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="button-primary">{isSubmitting ? "Saving…" : item ? "Save changes" : "Create item"}</button>
      </div>
    </form>
  );
}
