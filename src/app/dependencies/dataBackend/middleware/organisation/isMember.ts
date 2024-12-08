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

export default async function getIsOrganisationMember(uuid: number, username: string | null, directMember: boolean | null) {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const target = username || session.user.name;
  if (target !== session.user.name) {
    if ((await getUserPermission(session.user.name)) === null) {
      throw ERROR_USER_NOT_PERMITTED;
    }
  }
  const client = await connect();
  try {
    if (directMember) {
      const result = await client.query(`
        SELECT 1
        FROM "Society".Individual i
        WHERE i.Username = $1 AND i.Organisation = $2
      `, [ target, uuid ]);
      return Boolean(result.rowCount);
    }
    const result = await client.query(`
      SELECT 1
      FROM (WITH RECURSIVE OrganisationHierarchy AS (SELECT o1.Uuid, o1.Parent
                                                     FROM "Society".Organisation o1
                                                     WHERE
                                                       o1.Uuid = (SELECT i.Organisation
                                                                  FROM "Society".Individual i
                                                                  WHERE i.Username = $1)
                                                     UNION
                                                     SELECT o2.Uuid, o2.Parent
                                                     FROM "Society".Organisation o2
                                                            JOIN OrganisationHierarchy oh ON o2.Parent = oh.Uuid)
            SELECT 1
            FROM OrganisationHierarchy oh
            WHERE oh.Uuid = $2) AS t
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
