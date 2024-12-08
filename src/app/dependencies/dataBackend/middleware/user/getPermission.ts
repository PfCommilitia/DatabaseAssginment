import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

export default async function getUserPermission(username: string) {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  if (session.user.name === "0000000000") {
    return -1;
  }
  if (session.user.name === username) {
    return 1;
  }
  const client = await connect();
  try {
    const result1 = await client.query(`
      SELECT 1
      FROM (WITH RECURSIVE OrganisationHierarchy
                             AS (SELECT o1.Uuid, o1.Parent, o1.Representative
                                 FROM "Society".Organisation o1
                                 WHERE o1.Uuid = (SELECT i.Organisation
                                                  FROM "Society".Individual i
                                                  WHERE i.Username = $1)
                                 UNION
                                 SELECT o2.Uuid, o2.Parent, o2.Representative
                                 FROM "Society".Organisation o2
                                        JOIN OrganisationHierarchy oh ON o2.Parent = oh.Uuid)
            SELECT 1
            FROM OrganisationHierarchy oh
            WHERE oh.Representative = $2) AS t
    `, [ username, session.user.name ]);
    if (result1.rowCount) {
      return 0;
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