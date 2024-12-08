import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import placeSocietyApplication from "@/app/dependencies/dataBackend/middleware/societyApplication/place";

export async function POST(request: Request) {
  try {
    const { society, message } = await request.json();
    const result = await placeSocietyApplication(society, message);
    if (!result) {
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
