import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

export default async function getEventParticipationPermission(uuid: number): Promise<string[]> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const permissions = [];
  if (session.user.name === "0000000000") {
    permissions.push("admin");
    if (!permissions.includes("approve")) {
      permissions.push("approve");
    }
  }
  const client = await connect();
  try {
    const result1 = await client.query(`
      SELECT 1
      FROM (WITH RECURSIVE OrganisationHierarchy
                             AS (SELECT o1.Uuid, o1.Parent, o1.Representative
                                 FROM "Society".Organisation o1
                                 WHERE o1.Uuid = (SELECT s.Organisation
                                                  FROM "Society".Society s
                                                  WHERE s.Uuid = (SELECT ea.Society
                                                                  FROM "Society".EventApplication ea
                                                                  WHERE ea.Uuid =
                                                                        (SELECT epa.ApplyingEvent
                                                                         FROM "Society".EventParticipationApplication epa
                                                                         WHERE epa.Uuid = $1)))
                                 UNION
                                 SELECT o2.Uuid, o2.Parent, o2.Representative
                                 FROM "Society".Organisation o2
                                        JOIN OrganisationHierarchy oh ON o2.Parent = oh.Uuid)
            SELECT 1
            FROM OrganisationHierarchy oh
            WHERE oh.Representative = $2) AS t
    `, [ uuid, session.user.name ]);
    if (result1.rowCount) {
      permissions.push("organisationOwner");
      if (!permissions.includes("approve")) {
        permissions.push("approve");
      }
    }
    const result2 = await client.query(`
        SELECT 1
        FROM "Society".Society s
        WHERE s.Representative = $1
          AND s.Uuid = (SELECT ea.Society
                        FROM "Society".EventApplication ea
                        WHERE ea.Uuid = (SELECT epa.ApplyingEvent
                                         FROM "Society".EventParticipationApplication epa
                                         WHERE epa.Uuid = $2))
      `,
      [ session.user.name, uuid ]);
    if (result2.rowCount) {
      permissions.push("societyOwner");
      if (!permissions.includes("approve")) {
        permissions.push("approve");
      }
    }
    const result3 = await client.query(`
        SELECT 1
        FROM "Society".EventApplication ea
        WHERE ea.Applicant = $1
          AND ea.Uuid = (SELECT epa.ApplyingEvent
                         FROM "Society".EventParticipationApplication epa
                         WHERE epa.Uuid = $2)
      `,
      [ session.user.name, uuid ]);
    if (result3.rowCount) {
      permissions.push("eventApplicant");
      if (!permissions.includes("approve")) {
        permissions.push("approve");
      }
    }
    const result4 = await client.query(`
        SELECT 1
        FROM "Society".EventParticipationApplication epa
        WHERE epa.Applicant = $1
          AND epa.Uuid = $2
      `,
      [ session.user.name, uuid ]);
    if (result4.rowCount) {
      permissions.push("applicant");
    }
    return permissions;
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