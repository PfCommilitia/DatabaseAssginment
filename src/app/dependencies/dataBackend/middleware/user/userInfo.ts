import { getServerSession } from "next-auth";
import { connect } from "@/app/dependencies/dataBackend/dataSource";
import {
  ERROR_SESSION_NOT_FOUND,
  ERROR_NO_USER_IN_SESSION
} from "@/app/dependencies/error/session";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";

export default async function fetchUserInfo():
  Promise<{ username: string, name: string, organisationName: string, initialized: boolean } | null> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const client = await connect();
  try {
    const result = await client.query(
      `SELECT i.Username, i.Name, o.Name AS OrganisationName, i.IsInitialized
       FROM "Society".Individual i
         JOIN "Society".Organisation o
       ON i.Organisation = o.Uuid
       WHERE i.Username = $1`,
      [ session.user.name ]
    );
    if (result.rowCount) {
      return {
        username: result.rows[0].username,
        name: result.rows[0].name,
        organisationName: result.rows[0].organisationname,
        initialized: result.rows[0].isinitialized
      };
    }
    return null;
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