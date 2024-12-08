import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";

export default async function placeEventParticipationApplication(
  applyingEvent: number,
): Promise<number | null> {
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
      `INSERT INTO "Society".EventParticipationApplication
         (Applicant, ApplyingEvent)
       VALUES ($1, $2)`,
      [ session.user.name, applyingEvent ]
    );
    if (!result.rowCount) {
      return null;
    }
    return result.rowCount;
  } catch (e) {
    if (!(e instanceof Error)) {
      throw ERROR_UNKNOWN;
    }
    console.log(e);
    e = processDBError(e);
    throw e;
  } finally {
    client.release();
  }
}
