import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import updateSociety from "@/app/dependencies/dataBackend/middleware/societyManagement/updateSociety";

export async function POST(request: Request) {
  try {
    // 从请求中获取前端传来的社团修改信息
    const { societyId, newName, newDescription } = await request.json();

    // 调用API接口处理修改社团信息
    const result = await updateSociety(societyId, newName, newDescription);

    // 如果修改失败，返回错误信息
    if (!result) {
      return NextResponse.json({ error: "Failed to update society" }, { status: 400 });
    }

    // 成功返回空的payload
    return NextResponse.json({ payload: {} }, { status: 200 });
  } catch (e) {
    // 错误处理
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
