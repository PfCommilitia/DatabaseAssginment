import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import { ERROR_INCORRECT_USERNAME_OR_PASSWORD } from "@/app/dependencies/error/session";
import changePassword
  from "@/app/dependencies/dataBackend/middleware/user/changePassword";

export async function POST(request: Request) {
  try {
    const { username, password, passwordNew } = await request.json();
    const result = await changePassword(username, password, passwordNew);
    if (!result) {
      return NextResponse.json({ error: ERROR_INCORRECT_USERNAME_OR_PASSWORD.code }, { status: 404 });
    }
    return NextResponse.json({ username: username }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}