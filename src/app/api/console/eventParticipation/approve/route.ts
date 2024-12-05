import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import approveEventParticipationApplication from "@/app/dependencies/dataBackend/middleware/eventParticipation/approve";

export async function POST(request: Request) {
  try {
    const { uuid, result, comment, timestamp } = await request.json();
    const result0 = await approveEventParticipationApplication(uuid, result, comment, timestamp);
    if (!result0) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 404 });
    }
    return NextResponse.json({ payload: {} }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
