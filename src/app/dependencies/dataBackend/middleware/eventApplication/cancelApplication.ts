import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";

export default async function cancelEventApplication(uuid: string): Promise<number | null> {
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
      `UPDATE "Society".EventApplication
       SET IsActive = FALSE
       WHERE Uuid = $1
         AND Applicant = $2
         AND IsActive;`,
      [ uuid, session.user.name ]
    );
    if (!result.rowCount) {
      return null;
    }
    return result.rowCount;
  } finally {
    client.release();
  }
}