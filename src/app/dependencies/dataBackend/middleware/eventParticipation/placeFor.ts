import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";
import { getServerSession } from "next-auth";
import { uuidv7 } from "uuidv7";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";

export default async function placeEventParticipationApplicationFor(
  applyingEvent: string,
  applicant: string,
  timeStamp: string
): Promise<string | null> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const client = await connect();
  try {
    // Checking permission
    const validation = await client.query(
      `
        WITH RECURSIVE OrganisationHierarchy AS (SELECT Uuid, Parent, Representative
                                                 FROM "Society".Organisation
                                                 WHERE Uuid = (SELECT Organisation
                                                               FROM "Society".Individual
                                                               WHERE Username = $1)
                                                 UNION
                                                 SELECT O.Uuid, O.Parent, O.Representative
                                                 FROM "Society".Organisation O
                                                        JOIN OrganisationHierarchy oh
                                                             ON O.Uuid = oh.Parent)
        SELECT 1
        FROM OrganisationHierarchy
        WHERE Representative = $2
        LIMIT 1
      `
    );
    if (!validation.rowCount && applicant !== session.user.name) {
      throw ERROR_USER_NOT_PERMITTED;
    }

    const uuid = uuidv7();
    const result = await client.query(
      `INSERT INTO "Society".EventParticipationApplication
         (Uuid, Applicant, ApplyingEvent, TimeStamp)
       VALUES ($1, $2, $3, $4)`,
      [ uuid, applicant, applyingEvent, new Date(timeStamp) ]
    );
    if (!result.rowCount) {
      return null;
    }
    return uuid;
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
