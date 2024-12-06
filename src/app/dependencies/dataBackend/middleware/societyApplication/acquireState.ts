import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { SocietyApplication } from "@/app/dependencies/dataBackend/middleware/societyApplication/list";

export default async function acquireSocietyApplicationState(societyApplication: string) {
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
       FROM "Society".SocietyApplication sa
       WHERE sa.Uuid = $1
         AND (
         sa.Applicant = $2 OR EXISTS (SELECT 1
                                      FROM "Society".Society s
                                      WHERE s.Uuid = sa.Society
                                        AND s.Representative = $2)
         )
       UNION
       SELECT 1
       FROM (WITH RECURSIVE OrganisationHierarchy
                              AS (SELECT o.Uuid, o.Parent, o.Representative
                                  FROM "Society".Organisation o
                                  WHERE o.Uuid = (SELECT s.Organisation
                                                  FROM "Society".Society s
                                                  WHERE s.Uuid = (SELECT sa.Society
                                                                  FROM "Society".SocietyApplication sa
                                                                  WHERE sa.Uuid = $1))
                                  UNION
                                  SELECT o.Uuid, o.Parent, o.Representative
                                  FROM "Society".Organisation o
                                         JOIN OrganisationHierarchy oh
                                              ON oh.Parent = o.Uuid)
             SELECT 1
             FROM OrganisationHierarchy oh
             WHERE oh.Representative = $2) AS oh
       LIMIT 1`,
      [ societyApplication, session.user.name ]
    );
    if (!permissionCheck.rowCount) {
      throw ERROR_USER_NOT_PERMITTED;
    }

    const result = await client.query(
      `SELECT sa.Uuid,
              i.Username,
              s.Name,
              sa.Description,
              sa.IsActive,
              saa.Result,
              sa.Timestamp
       FROM "Society".SocietyApplication sa
              LEFT OUTER JOIN "Society".SocietyApplicationApproval saa
                              ON saa.Application = sa.Uuid
              LEFT OUTER JOIN "Society".Individual i ON i.Username = sa.Applicant
              LEFT OUTER JOIN "Society".Society s ON s.Uuid = sa.Society
       WHERE sa.Uuid = $1`,
      [ societyApplication ]
    );
    if (!result.rowCount) {
      return null;
    }

    const row = result.rows[0];
    return [
      row.Uuid,
      row.Username,
      row.Name,
      row.Description,
      row.IsActive,
      row.Result === null ? "pending" : (row.Result ? "approved" : "rejected"),
      new Date(row.Timestamp).toString()
    ] as SocietyApplication;
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
