import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";
import getUserPermission
  from "@/app/dependencies/dataBackend/middleware/user/getPermission";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";

export default async function getIsSocietyMember(uuid: number, username: string | null) {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const target = username || session.user.name;
  if (target !== session.user.name) {
    if (!(await getUserPermission(session.user.name))) {
      throw ERROR_USER_NOT_PERMITTED;
    }
  }
  const client = await connect();
  try {
    const result = await client.query(`
      SELECT 1
      FROM "Society".Membership
      WHERE individual = $1 AND society = $2 AND IsActive
    `, [ target, uuid ]);
    return Boolean(result.rowCount);
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
