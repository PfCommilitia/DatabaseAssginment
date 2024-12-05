import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import cancelEventApplication
  from "@/app/dependencies/dataBackend/middleware/eventApplication/cancel";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";

export async function POST(request: Request) {
  try {
    const { uuid } = await request.json();
    const result = await cancelEventApplication(uuid);
    if (!result) {
      return NextResponse.json({ error: ERROR_USER_NOT_PERMITTED.code }, { status: 404 });
    }
    return NextResponse.json({ payload: {} }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
