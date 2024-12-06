import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import acquireEventApplicationState
  from "@/app/dependencies/dataBackend/middleware/eventApplication/acquireState";

export async function POST(request: Request) {
  try {
    const { eventApplication } = await request.json();
    const result = await acquireEventApplicationState(eventApplication);
    if (!result) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ payload: result }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
