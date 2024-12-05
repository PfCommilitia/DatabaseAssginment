import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import assignRepresentative from "@/app/dependencies/dataBackend/middleware/societyManagement/assignRepresentative";

export async function POST(request: Request) {
  try {
    // 从请求中获取前端传来的社团ID和负责人信息
    const { societyId, representativeId } = await request.json();

    // 调用API接口处理指定社团负责人
    const result = await assignRepresentative(societyId, representativeId);

    // 如果指定负责人失败，返回错误信息
    if (!result) {
      return NextResponse.json({ error: "Failed to assign representative" }, { status: 400 });
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
