import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";
import { parse as parseRange } from "postgres-range";
import processDBError, { ERROR_PARSING_DATE } from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { EventParticipationApplication } from "@/app/dependencies/dataBackend/middleware/eventParticipation/list";

export default async function acquireEventParticipationState(eventParticipation: string) {
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
       FROM "Society".EventParticipationApplication eap
       WHERE eap.Uuid = $1
         AND (
         eap.Applicant = $2 OR EXISTS (SELECT 1
                                       FROM "Society".Society s
                                       WHERE s.Uuid = (SELECT ea.Society
                                                       FROM "Society".EventApplication ea
                                                       WHERE ea.Uuid = eap.ApplyingEvent)
                                         AND s.Representative = $2)
         )
       UNION
       SELECT 1
       FROM (WITH RECURSIVE OrganisationHierarchy
                              AS (SELECT o.Uuid, o.Parent, o.Representative
                                  FROM "Society".Organisation o
                                  WHERE o.Uuid = (SELECT s.Organisation
                                                  FROM "Society".Society s
                                                  WHERE s.Uuid = (SELECT ea.Society
                                                                  FROM "Society".EventApplication ea
                                                                  WHERE ea.Uuid =
                                                                        (SELECT eap.ApplyingEvent
                                                                         FROM "Society".EventParticipationApplication eap
                                                                         WHERE eap.Uuid = $1)))
                                  UNION
                                  SELECT o.Uuid, o.Parent, o.Representative
                                  FROM "Society".Organisation o
                                         JOIN OrganisationHierarchy oh
                                              ON oh.Parent = o.Uuid)
             SELECT 1
             FROM OrganisationHierarchy oh
             WHERE oh.Representative = $2) AS oh
       LIMIT 1`,
      [ eventParticipation, session.user.name ]
    );
    if (!permissionCheck.rowCount) {
      throw ERROR_USER_NOT_PERMITTED;
    }

    const result = await client.query(
      `SELECT epa.Uuid,
              epa.Applicant,
              s.Name        AS Society,
              v.Name        AS Venue,
              ea.Applicant  AS Organiser,
              ea.TimeRange,
              epa.Timestamp AS ApplicationTime,
              ea.Title,
              ea.Description,
              epa.IsActive,
              eaa.Result    AS Status,
              epaa.Result   AS ParticipationStatus
       FROM "Society".EventParticipationApplication epa
              LEFT OUTER JOIN "Society".EventApplication ea ON epa.ApplyingEvent = ea.uuid
              LEFT OUTER JOIN "Society".Society s ON ea.Society = s.Uuid
              LEFT OUTER JOIN "Society".Venue v ON ea.Venue = v.Uuid
              LEFT OUTER JOIN "Society".EventApplicationApproval eaa
                              ON ea.Uuid = eaa.Application
              LEFT OUTER JOIN "Society".EventParticipationApproval epaa
                              ON epa.Uuid = epaa.Application
       WHERE epa.Uuid = $1`,
      [ eventParticipation ]
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
    toReturn.push(row.organiser);
    const timeRange = parseRange(row.timerange);
    if (!timeRange.lower || !timeRange.upper) {
      throw ERROR_PARSING_DATE;
    }
    toReturn.push([ new Date(timeRange.lower).toString(), new Date(timeRange.upper).toString() ]);
    toReturn.push(new Date(row.applicationtime).toString());
    toReturn.push(row.title);
    toReturn.push(row.description);
    toReturn.push(row.isactive);
    toReturn.push(row.status === null ? "pending" : (row.status ? "approved" : "rejected"));
    toReturn.push(row.participationstatus === null ? "pending" : (row.participationstatus ? "approved" : "rejected"));
    return toReturn as EventParticipationApplication;
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
