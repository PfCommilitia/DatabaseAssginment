import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import {
  ERROR_SESSION_NOT_FOUND,
  ERROR_NO_USER_IN_SESSION,
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import { getServerSession } from "next-auth";

export default async function createSociety(
  societyName: string,
  organizationId: string,
  description: string
): Promise<boolean | null> {
  const client = await connect();

  // 验证用户权限
  const session = await getServerSession();
  if (!session) throw ERROR_SESSION_NOT_FOUND;
  if (!session.user) throw ERROR_NO_USER_IN_SESSION;

  try {
    // 检查用户是否有权限创建社团
    const permissionCheck = await client.query(
      `SELECT COUNT(*) FROM "Society".Membership m
       JOIN "Society".Organisation o ON m.Organisation = o.Uuid
       WHERE m.Individual = $1 AND o.Uuid = $2 AND (m.Role = 'Admin' OR m.Role = 'Leader')`,
      [session.user.name, organizationId]
    );

    if (parseInt(permissionCheck.rows[0].count, 10) === 0) {
      throw ERROR_USER_NOT_PERMITTED;
    }

    // 插入新社团记录
    const result = await client.query(
      `INSERT INTO "Society".Society (Name, Organisation, Description, CreatedAt)
       VALUES ($1, $2, $3, NOW()) RETURNING Uuid`,
      [societyName, organizationId, description]
    );

    if (!result.rowCount) {
      throw new ServerError("Failed to create society", 400);
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
