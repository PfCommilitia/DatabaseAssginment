import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

export default async function getAnyPermission() {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  if (session.user.name === "0000000000") {
    return true;
  }
  const client = await connect();
  try {
    const result1 = await client.query(`
      SELECT 1
      FROM "Society".Society s
      WHERE s.Representative = $1
      LIMIT 1
    `, [ session.user.name ]);
    if (result1.rowCount) {
      return true;
    }
    const result2 = await client.query(`
      SELECT 1
      FROM "Society".Organisation o
      WHERE o.Representative = $1
      LIMIT 1
    `, [ session.user.name ]);
    return Boolean(result2.rowCount);
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
