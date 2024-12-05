import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { getServerSession } from "next-auth";
import { ERROR_SESSION_NOT_FOUND, ERROR_NO_USER_IN_SESSION } from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";

export default async function updateSociety(societyId: string, newName: string, newDescription: string): Promise<boolean | null> {
  // 获取当前登录用户信息
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user) {
    throw ERROR_NO_USER_IN_SESSION;
  }

  // 获取数据库连接
  const client = await connect();
  try {
    // 检查当前用户是否是社团管理员或社团所属组织负责人
    const result = await client.query(
      `SELECT COUNT(*) FROM "Society".Membership m
         JOIN "Society".Society s ON m.Society = s.Uuid
         WHERE m.Individual = $1 AND s.Uuid = $2 AND (m.Role = 'Admin' OR m.Role = 'Leader')`,
      [session.user.name, societyId]
    );

    if (parseInt(result.rows[0].count) === 0) {
      throw ERROR_USER_NOT_PERMITTED;
    }

    // 修改社团信息
    const updateResult = await client.query(
      `UPDATE "Society".Society
       SET Name = $1, Description = $2
       WHERE Uuid = $3`,
      [newName, newDescription, societyId]
    );

    // 如果没有更新任何记录，则修改失败
    if (updateResult.rowCount === 0) {
      return null;
    }

    return true;
  } catch (e) {
    if (!(e instanceof Error)) {
      throw ERROR_UNKNOWN;
    }
    e = processDBError(e);
    throw e;
  } finally {
    client.release();
  }
}
