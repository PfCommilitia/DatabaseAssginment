import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import createSociety from "@/app/dependencies/dataBackend/middleware/societyManagement/createSociety";

export async function POST(request: Request) {
  try {
    // 从请求中获取前端传来的社团信息
    const { societyName, organizationId, description } = await request.json();

    // 调用API接口处理创建社团
    const result = await createSociety(societyName, organizationId, description);

    // 如果社团创建失败，返回错误信息
    if (!result) {
      return NextResponse.json({ error: "Failed to create society" }, { status: 400 });
    }

    // 成功返回空的payload
    return NextResponse.json({ payload: {} }, { status: 200 });
  } catch (e) {
    // 检查错误是否为 ServerError 类型
    if (e instanceof ServerError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: 400 });
    }

    // 如果不是 ServerError 类型，返回未知错误
    return NextResponse.json({ error: ERROR_UNKNOWN.code, message: ERROR_UNKNOWN.message }, { status: 500 });
  }
}
