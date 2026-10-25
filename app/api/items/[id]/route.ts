import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { updateItemSchema } from "@/lib/validations/item";

const peopleSelect = { id: true, name: true, email: true } as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const item = await getDb().calendarItem.findFirst({
    where: { id, ownerId: userId },
    include: {
      owner: { select: peopleSelect },
      assignee: { select: peopleSelect },
    },
  });

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const current = await getDb().calendarItem.findFirst({
    where: { id, ownerId: userId },
  });
  if (!current) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const parsed = updateItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form fields", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : current.startAt;
  const endAt =
    parsed.data.endAt === null
      ? null
      : parsed.data.endAt
        ? new Date(parsed.data.endAt)
        : current.endAt;

  if (endAt && endAt < startAt) {
    return NextResponse.json(
      { error: "End time must be after the start time" },
      { status: 400 },
    );
  }

  const item = await getDb().calendarItem.update({
    where: { id },
    data: {
      ...parsed.data,
      description:
        parsed.data.description === undefined ? undefined : parsed.data.description || null,
      assigneeId: userId,
      startAt: parsed.data.startAt ? startAt : undefined,
      endAt: parsed.data.endAt === undefined ? undefined : endAt,
    },
    include: {
      owner: { select: peopleSelect },
      assignee: { select: peopleSelect },
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const result = await getDb().calendarItem.deleteMany({
    where: { id, ownerId: userId },
  });

  if (!result.count) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
