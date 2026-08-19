import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";

type TestDbResult = {
  ok: number;
};

export async function GET() {
  try {
    const result = await prisma.$queryRaw<TestDbResult[]>`SELECT 1 as ok`;

    return Response.json({
      success: result[0]?.ok === 1,
      message: "Database connection is working",
      result: result[0] ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return Response.json(
      {
        success: false,
        message: "Database connection failed",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
