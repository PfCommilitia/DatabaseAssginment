import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";

export default async function changePassword(username: string, password: string, newPassword: string):
  Promise<number | null> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  if (session.user.name !== username) {
    throw ERROR_USER_NOT_PERMITTED;
  }
  const client = await connect();
  try {
    const result = await client.query(
      `UPDATE "Society".Individual
       SET PasswordHash = CRYPT($3, GEN_SALT('bf', 8))
       WHERE Username = $1
         AND PasswordHash = CRYPT($2, PasswordHash)
         AND IsActive;`,
      [ username, password, newPassword ]
    );
    if (!result.rowCount) {
      return null;
    }
    return result.rowCount;
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