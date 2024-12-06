import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { User } from "@/app/dependencies/dataBackend/middleware/user/list";

export default async function acquireUserState(username: string) {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const client = await connect();
  try {
    const permissionCheck = await client.query(
      `SELECT 1
       FROM "Society".Individual i
       WHERE i.Username = $1
         AND i.Username = $2
       UNION
       SELECT 1
       FROM (WITH RECURSIVE OrganisationHierarchy
                              AS (SELECT o.Uuid, o.Parent, o.Representative
                                  FROM "Society".Organisation o
                                  WHERE o.Uuid = (SELECT i.Organisation
                                                  FROM "Society".Individual i
                                                  WHERE i.Username = $1)
                                  UNION
                                  SELECT o.Uuid, o.Parent, o.Representative
                                  FROM "Society".Organisation o
                                         JOIN OrganisationHierarchy oh
                                              ON oh.Parent = o.Uuid)
             SELECT 1
             FROM OrganisationHierarchy oh
             WHERE oh.Representative = $2) AS oh
       LIMIT 1`,
      [ username, session.user.name ]
    );
    if (!permissionCheck.rowCount) {
      throw ERROR_USER_NOT_PERMITTED;
    }

    const result = await client.query(
      `SELECT i.Username, i.Name, i.IsActive, i.IsInitialized, o.Name AS Organisation
       FROM "Society".Individual i
              LEFT OUTER JOIN "Society".Organisation o ON i.Organisation = o.Uuid
       WHERE i.Username = $1`,
      [ username ]
    );
    if (!result.rowCount) {
      return null;
    }

    const row = result.rows[0];
    return [
      row.Username,
      row.Name,
      row.IsActive,
      row.IsInitialized,
      row.Organisation
    ] as User;
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
