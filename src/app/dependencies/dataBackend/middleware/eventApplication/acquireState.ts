import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";
import { parse as parseRange } from "postgres-range";
import processDBError, { ERROR_PARSING_DATE } from "@/app/dependencies/error/database";
import { EventApplication } from "@/app/dependencies/dataBackend/middleware/eventApplication/list";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";

export default async function acquireEventApplicationState(eventApplication: string) {
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
       FROM "Society".EventApplication ea
       WHERE ea.Uuid = $1
         AND (
           ea.Applicant = $2 OR EXISTS (
             SELECT 1
             FROM "Society".Society s
             WHERE s.Uuid = ea.Society
               AND s.Representative = $2
           )
         )
       UNION
       SELECT 1
       FROM (WITH RECURSIVE OrganisationHierarchy
                              AS (SELECT o.Uuid, o.Parent, o.Representative
                                  FROM "Society".Organisation o
                                  WHERE o.Uuid = (SELECT s.Organisation
                                                  FROM "Society".Society s
                                                  WHERE s.Uuid = (
                                                    SELECT ea.Society
                                                    FROM "Society".EventApplication ea
                                                    WHERE ea.Uuid = $1
                                                  ))
                                  UNION
                                  SELECT o.Uuid, o.Parent, o.Representative
                                  FROM "Society".Organisation o
                                         JOIN OrganisationHierarchy oh
                                              ON oh.Parent = o.Uuid)
             SELECT 1
             FROM OrganisationHierarchy oh
             WHERE oh.Representative = $2) AS oh
       LIMIT 1`,
      [ eventApplication, session.user.name ]
    );
    if (!permissionCheck.rowCount) {
      throw ERROR_USER_NOT_PERMITTED;
    }

    const result = await client.query(
      `SELECT ea.Uuid,
              i.Name,
              s.Name,
              v.Name,
              TimeRange,
              Title,
              ea.Description,
              ea.IsActive,
              ea.Capacity,
              Result
       FROM "Society".EventApplication ea
              LEFT OUTER JOIN "Society".EventApplicationApproval eaa
                              ON Uuid = Application
              LEFT OUTER JOIN "Society".Individual i
                              ON Applicant = Username
              LEFT OUTER JOIN "Society".Society s
                              ON Society = s.Uuid
              LEFT OUTER JOIN "Society".Venue v
                              ON Venue = v.Uuid
       WHERE ea.Uuid = $1`,
      [ eventApplication ]
    );
    if (!result.rowCount) {
      return null;
    }

    const row = result.rows[0];
    const toReturn = [];
    toReturn.push(row.uuid);
    toReturn.push(row.applicant);
    toReturn.push(row.society);
    toReturn.push(row.venue);
    const timeRange = parseRange(row.timerange);
    if (!timeRange.lower || !timeRange.upper) {
      throw ERROR_PARSING_DATE;
    }
    toReturn.push([ new Date(timeRange.lower).toString(), new Date(timeRange.upper).toString() ]);
    toReturn.push(row.title);
    toReturn.push(row.description);
    toReturn.push(row.isactive);
    toReturn.push(row.capacity);
    toReturn.push(row.result === null ? "pending" : (row.result ? "approved" : "rejected"));
    return toReturn as EventApplication;
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