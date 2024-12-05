import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import deactivateSociety from "@/app/dependencies/dataBackend/middleware/societyManagement/deactivateSociety";

export async function POST(request: Request) {
  try {
    // 从请求中获取前端传来的社团ID
    const { societyId } = await request.json();

    // 调用API接口处理停用社团
    const result = await deactivateSociety(societyId);

    // 如果停用失败，返回错误信息
    if (!result) {
      return NextResponse.json({ error: "Failed to deactivate society" }, { status: 400 });
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
