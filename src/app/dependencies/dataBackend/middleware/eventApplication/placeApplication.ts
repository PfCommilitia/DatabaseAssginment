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

export default async function placeEventApplication(
  applicant: string,
  society: string,
  venue: string,
  startTimestamp: string,
  endTimestamp: string,
  title: string,
  description: string,
  capacity: number | null
): Promise<string | null> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  if (session.user.name !== applicant) {
    throw ERROR_USER_NOT_PERMITTED;
  }
  const client = await connect();
  try {
    const uuid = uuidv7();
    const result = await client.query(
      `INSERT INTO "Society".EventApplication
       (Uuid, Applicant, Society, Venue, TimeRange, Title, Description, Capacity)
       VALUES ($1, $2, $3, $4, tstzrange($5, $6), $7, $8, $9)`,
      [ uuid, applicant, society, venue, startTimestamp, endTimestamp, title, description, capacity ]
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