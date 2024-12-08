import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import getEventParticipationPermission
  from "@/app/dependencies/dataBackend/middleware/eventParticipation/getPermission";

export async function POST(request: Request) {
  try {
    const { uuid } = await request.json();
    const result = await getEventParticipationPermission(uuid);
    return NextResponse.json({ payload: result }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
