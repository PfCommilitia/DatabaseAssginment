import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";
import migrateSociety from "@/app/dependencies/dataBackend/middleware/society/migrate";

export async function POST(request: Request) {
  try {
    const { society, organisation } = await request.json();
    const result = await migrateSociety(society, organisation);
    if (!result) {
      return NextResponse.json({ error: ERROR_USER_NOT_PERMITTED.code }, { status: 403 });
    }
    return NextResponse.json({ payload: {} }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
