import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

export default async function ApproveEventApplication(
  uuid: string,
  result: boolean,
  comment: string,
  timestamp: string
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
    const time = new Date(timestamp);
    const result0 = await client.query(
      `INSERT INTO "Society".EventParticipationApproval (Application, Approver, Result, Comment, Timestamp)
       VALUES ($1, $2, $3, $4, $5)`,
      [ uuid, session.user.name, result, comment, time ]
    );
    if (!result0.rowCount) {
      return null;
    }
    return result0.rowCount;
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
