import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";

// 迁移社团的功能实现
export default async function migrateSociety(societyId: string, newOrganizationId: string):
  Promise<boolean | null> {
  const session = await getServerSession();
  
  // 1. 获取当前登录的用户会话信息
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user) {
    throw ERROR_NO_USER_IN_SESSION;
  }

  // 2. 确认当前用户是否是社团管理员，且具有迁移权限
  const client = await connect();
  try {
    const result = await client.query(
      `SELECT o.Uuid AS organization_id
       FROM "Society".Society s
       JOIN "Society".Membership m ON s.Uuid = m.Society
       JOIN "Society".Organisation o ON s.Organization = o.Uuid
       WHERE s.Uuid = $1
         AND m.Individual = $2
         AND m.IsActive
         AND (o.Uuid = $3 OR EXISTS (
           WITH RECURSIVE OrganisationHierarchy AS (
             SELECT Uuid, Parent
             FROM "Society".Organisation
             WHERE Uuid = $3
             UNION ALL
             SELECT o.Uuid, o.Parent
             FROM "Society".Organisation o
             JOIN OrganisationHierarchy h ON o.Parent = h.Uuid
           )
           SELECT 1 FROM OrganisationHierarchy WHERE Uuid = o.Uuid
         ))`, 
      [societyId, session.user.name, newOrganizationId]
    );

    // 3. 检查结果，如果找不到合适的记录，说明用户没有权限迁移社团
    if (result.rowCount === 0) {
        throw ERROR_USER_NOT_PERMITTED;
    }

    // 4. 执行社团迁移操作
    await client.query(
      `UPDATE "Society".Society
       SET Organization = $1
       WHERE Uuid = $2`,
      [newOrganizationId, societyId]
    );

    return true;
  } catch (e) {
    if (!(e instanceof Error)) {
      throw ERROR_UNKNOWN;
    }
    e = processDBError(e);
    throw e;
  } finally {
    // 5. 释放数据库连接
    client.release();
  }
}
