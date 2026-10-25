import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { getDb } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please correct the highlighted fields", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await getDb().user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hash(parsed.data.password, 12),
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists", issues: { fieldErrors: { email: ["An account with this email already exists"] }, formErrors: [] } },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Account could not be created" }, { status: 500 });
  }
}
