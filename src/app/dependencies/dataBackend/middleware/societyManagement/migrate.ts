import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";

export default async function migrateSociety(
  society: string,
  organisation: string
):
  Promise<number | null> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  // Only global admin can migrate society
  if (session.user.name !== "00000000000") {
    throw ERROR_USER_NOT_PERMITTED;
  }

  const client = await connect();
  try {
    const result = await client.query(
      `UPDATE "Society".Society
       SET Organisation = $1
       WHERE Uuid = $2`,
      [ organisation, society ]
    );
    if (result.rowCount === 0) {
        throw ERROR_USER_NOT_PERMITTED;
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
