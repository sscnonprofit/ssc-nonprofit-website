import {
  adminWorkspace,
  mutateWorkspace,
  publishedWorkspace,
} from "@/lib/calendars/service";
import { CalendarInputError } from "@/lib/calendars/validation";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    return Response.json(
      new URL(request.url).searchParams.has("admin")
        ? await adminWorkspace()
        : await publishedWorkspace(),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 1_000_000)
    return Response.json({ error: "Request too large" }, { status: 413 });
  try {
    const body = await request.text();
    if (body.length > 1_000_000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const input = JSON.parse(body);
    if (
      !input ||
      typeof input !== "object" ||
      typeof input.action !== "string" ||
      !Number.isInteger(input.version)
    )
      return Response.json(
        { error: "Invalid calendar request" },
        { status: 400 },
      );
    return Response.json(await mutateWorkspace(input));
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  if (error instanceof SyntaxError)
    return Response.json({ error: "Invalid JSON request" }, { status: 400 });
  if (error instanceof CalendarInputError)
    return Response.json(
      { error: error.message },
      { status: error.message.includes("Sign in") ? 401 : 400 },
    );
  console.error("Calendar request failed", error);
  return Response.json(
    { error: "Calendar request failed. Please try again." },
    { status: 500 },
  );
}
