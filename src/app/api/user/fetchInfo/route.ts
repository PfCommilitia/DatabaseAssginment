import { NextResponse } from "next/server";
import fetchUserInfo from "@/app/dependencies/dataBackend/middleware/user/userInfo";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import { ERROR_NO_USER_IN_SESSION } from "@/app/dependencies/error/session";

export async function POST() {
  try {
    const response = await fetchUserInfo();
    if (!response) {
      return NextResponse.json({ error: ERROR_NO_USER_IN_SESSION.code }, { status: 404 });
    }
    return NextResponse.json({ payload: response }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}