import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import getIsSocietyMember
  from "@/app/dependencies/dataBackend/middleware/society/isMember";

export async function POST(request: Request) {
  try {
    const { uuid, username } = await request.json();
    const result = await getIsSocietyMember(uuid, username);
    return NextResponse.json({ payload: result }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
