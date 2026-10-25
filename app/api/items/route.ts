import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { viewableBy } from "@/lib/permissions";
import { getCurrentUserId } from "@/lib/session";
import { createItemSchema, itemRangeSchema } from "@/lib/validations/item";

const peopleSelect = { id: true, name: true, email: true } as const;

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const parsed = itemRangeSchema.safeParse({
    start: url.searchParams.get("start"),
    end: url.searchParams.get("end"),
    type: url.searchParams.get("type") || undefined,
    assigneeId: url.searchParams.get("assigneeId") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid calendar range" }, { status: 400 });
  }

  const rangeStart = new Date(parsed.data.start);
  const rangeEnd = new Date(parsed.data.end);
  if (rangeEnd <= rangeStart) {
    return NextResponse.json({ error: "Range end must be after its start" }, { status: 400 });
  }

  const items = await getDb().calendarItem.findMany({
    where: {
      AND: [
        viewableBy(userId),
        {
          OR: [
            { endAt: null, startAt: { gte: rangeStart, lt: rangeEnd } },
            {
              endAt: { not: null, gt: rangeStart },
              startAt: { lt: rangeEnd },
            },
          ],
        },
        parsed.data.type ? { type: parsed.data.type } : {},
        parsed.data.assigneeId ? { assigneeId: parsed.data.assigneeId } : {},
      ],
    },
    include: {
      owner: { select: peopleSelect },
      assignee: { select: peopleSelect },
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form fields", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.assigneeId) {
    const assignee = await getDb().user.findUnique({
      where: { id: parsed.data.assigneeId },
      select: { id: true },
    });
    if (!assignee) {
      return NextResponse.json({ error: "Assignee was not found" }, { status: 400 });
    }
  }

  const item = await getDb().calendarItem.create({
    data: {
      ...parsed.data,
      description: parsed.data.description || null,
      assigneeId: parsed.data.assigneeId || null,
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      ownerId: userId,
    },
    include: {
      owner: { select: peopleSelect },
      assignee: { select: peopleSelect },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
