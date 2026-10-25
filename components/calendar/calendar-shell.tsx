"use client";

import FullCalendar, {
  type CalendarRef,
  type DateClickInfo,
  type EventClickInfo,
  type EventDropInfo,
  type EventInput,
  type EventResizeDoneInfo,
  type EventSourceFuncInfo,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import formaThemePlugin from "@fullcalendar/react/themes/forma";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ItemForm } from "@/components/items/item-form";
import { Modal } from "@/components/ui/modal";
import { selectedDateLabel } from "@/lib/dates";
import type { CalendarItem, ItemFormValues, ItemType, Person } from "@/types/calendar";

const typeColors: Record<ItemType, string> = {
  TASK: "#3157d5",
  EVENT: "#8b5cf6",
  MEETING: "#0f9f8f",
  DEADLINE: "#e45757",
};

const labels = {
  TASK: "Task",
  EVENT: "Event",
  MEETING: "Meeting",
  DEADLINE: "Deadline",
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

type Dialog = "date-actions" | "schedule" | "form" | "details" | null;
type SaveValues = Omit<ItemFormValues, "startAt" | "endAt"> & {
  startAt: string;
  endAt: string | null;
};

function eventFromItem(item: CalendarItem): EventInput {
  return {
    id: item.id,
    title: item.title,
    start: item.startAt,
    end: item.endAt ?? undefined,
    allDay: item.allDay,
    backgroundColor: typeColors[item.type],
    borderColor: typeColors[item.type],
    extendedProps: { item },
  };
}

function formatWhen(item: CalendarItem) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: item.allDay ? undefined : "short",
  }).format(new Date(item.startAt));
}

export function CalendarShell({ currentUser }: { currentUser: Person }) {
  const calendarRef = useRef<CalendarRef>(null);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [users, setUsers] = useState<Person[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setUsers)
      .catch(() => setNotice("Assignee choices could not be loaded."));
  }, []);

  const loadEvents = useCallback(
    async (info: EventSourceFuncInfo, success: (events: EventInput[]) => void, failure: (error: Error) => void) => {
      const params = new URLSearchParams({ start: info.startStr, end: info.endStr });
      if (typeFilter) params.set("type", typeFilter);
      if (assigneeFilter) params.set("assigneeId", assigneeFilter);

      try {
        const response = await fetch(`/api/items?${params}`);
        if (!response.ok) throw new Error("Calendar items could not be loaded.");
        const data: CalendarItem[] = await response.json();
        setItems(data);
        setNotice("");
        success(data.map(eventFromItem));
      } catch (error) {
        const problem = error instanceof Error ? error : new Error("Calendar items could not be loaded.");
        setNotice(problem.message);
        failure(problem);
      }
    },
    [assigneeFilter, typeFilter],
  );

  useEffect(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, [typeFilter, assigneeFilter]);

  const dayItems = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return items.filter((item) => {
      const itemStart = new Date(item.startAt);
      const itemEnd = item.endAt ? new Date(item.endAt) : itemStart;
      return itemStart < end && itemEnd >= start;
    });
  }, [items, selectedDate]);

  function refresh() {
    calendarRef.current?.getApi().refetchEvents();
  }

  function onDateClick(info: DateClickInfo) {
    setSelectedDate(info.date.toISOString());
    setSelectedItem(null);
    setDialog("date-actions");
  }

  function onEventClick(info: EventClickInfo) {
    setSelectedItem(info.event.extendedProps.item as CalendarItem);
    setDialog("details");
  }

  async function saveItem(values: SaveValues) {
    const editing = Boolean(selectedItem);
    const response = await fetch(editing ? `/api/items/${selectedItem?.id}` : "/api/items", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Could not save the item.");
    setDialog(null);
    setSelectedItem(null);
    refresh();
  }

  async function moveItem(info: EventDropInfo | EventResizeDoneInfo) {
    const response = await fetch(`/api/items/${info.event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: info.event.start?.toISOString(),
        endAt: info.event.end?.toISOString() ?? null,
        allDay: info.event.allDay,
      }),
    });
    if (!response.ok) {
      info.revert();
      setNotice("That item could not be rescheduled. You may not have edit permission.");
      return;
    }
    refresh();
  }

  async function deleteItem() {
    if (!selectedItem || !window.confirm(`Delete “${selectedItem.title}”?`)) return;
    const response = await fetch(`/api/items/${selectedItem.id}`, { method: "DELETE" });
    if (!response.ok) {
      setNotice("The item could not be deleted.");
      return;
    }
    setDialog(null);
    setSelectedItem(null);
    refresh();
  }

  function createFor(date = new Date()) {
    setSelectedDate(date.toISOString());
    setSelectedItem(null);
    setDialog("form");
  }

  const ownsSelectedItem = selectedItem?.ownerId === currentUser.id;

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-600 font-black text-white">D</div>
            <div><p className="text-lg font-extrabold tracking-tight text-slate-950">Daymark</p><p className="text-xs text-slate-500">One place for every plan</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-bold text-slate-800">{currentUser.name}</p><p className="text-xs text-slate-500">{currentUser.email}</p></div>
            <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="button-secondary">Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Calendar</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">Your schedule, clearly planned</h1>
            <p className="mt-2 text-sm text-slate-500">Click a date to create an item or view that day’s schedule.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="filter-control"><span>Type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">All types</option><option value="TASK">Tasks</option><option value="EVENT">Events</option><option value="MEETING">Meetings</option><option value="DEADLINE">Deadlines</option></select></label>
            <label className="filter-control"><span>Assignee</span><select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option value="">Everyone</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
            <button type="button" onClick={() => createFor()} className="button-primary h-[46px]">+ New item</button>
          </div>
        </div>

        {notice ? <div role="status" className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss">×</button></div> : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_14px_45px_rgba(20,33,61,0.07)] sm:p-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, formaThemePlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
            todayText="Today"
            buttons={{
              dayGridMonth: { text: "Month" },
              timeGridWeek: { text: "Week" },
              timeGridDay: { text: "Day" },
              listWeek: { text: "Agenda" },
            }}
            events={loadEvents}
            dateClick={onDateClick}
            eventClick={onEventClick}
            eventDrop={moveItem}
            eventResize={moveItem}
            editable
            nowIndicator
            dayMaxEvents={3}
            height="auto"
          />
        </section>
      </div>

      <Modal open={dialog === "date-actions"} title={selectedDateLabel(selectedDate)} description="What would you like to do?" onClose={() => setDialog(null)}>
        <div className="grid gap-3">
          <button type="button" onClick={() => setDialog("form")} className="action-card"><span className="action-icon bg-blue-50 text-blue-700">＋</span><span><strong>Create new item</strong><small>Add a task, event, meeting, or deadline</small></span></button>
          <button type="button" onClick={() => setDialog("schedule")} className="action-card"><span className="action-icon bg-emerald-50 text-emerald-700">≡</span><span><strong>View schedule</strong><small>See everything planned for this date</small></span></button>
        </div>
      </Modal>

      <Modal open={dialog === "schedule"} title={selectedDateLabel(selectedDate)} description={`${dayItems.length} ${dayItems.length === 1 ? "item" : "items"} scheduled`} onClose={() => setDialog(null)}>
        {dayItems.length ? <div className="space-y-3">{dayItems.map((item) => <button type="button" key={item.id} onClick={() => { setSelectedItem(item); setDialog("details"); }} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40"><span className="h-10 w-1 rounded-full" style={{ backgroundColor: typeColors[item.type] }} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{item.title}</strong><small className="text-slate-500">{formatWhen(item)} · {labels[item.type]}</small></span></button>)}</div> : <div className="rounded-xl bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">Nothing is scheduled for this date.</div>}
      </Modal>

      <Modal open={dialog === "form"} title={selectedItem ? "Edit item" : "Create new item"} description="Dates are shown in your local time and saved in UTC." onClose={() => setDialog(null)} wide>
        <ItemForm item={selectedItem} initialDate={selectedDate} users={users} onSave={saveItem} onCancel={() => setDialog(null)} />
      </Modal>

      <Modal open={dialog === "details" && Boolean(selectedItem)} title={selectedItem?.title ?? "Item details"} description={selectedItem ? `${labels[selectedItem.type]} · ${formatWhen(selectedItem)}` : undefined} onClose={() => setDialog(null)}>
        {selectedItem ? <div>
          <div className="grid grid-cols-2 gap-3 text-sm"><Detail label="Status" value={labels[selectedItem.status]} /><Detail label="Priority" value={labels[selectedItem.priority]} /><Detail label="Assignee" value={selectedItem.assignee?.name ?? "Unassigned"} /><Detail label="Owner" value={selectedItem.owner.name} /></div>
          {selectedItem.description ? <div className="mt-5 border-t border-slate-100 pt-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedItem.description}</p></div> : null}
          {ownsSelectedItem ? <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={deleteItem} className="button-danger">Delete</button><button type="button" onClick={() => setDialog("form")} className="button-primary">Edit item</button></div> : <p className="mt-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">This item is shared with you as read-only.</p>}
        </div> : null}
      </Modal>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>;
}
