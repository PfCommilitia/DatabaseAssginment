import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";

export default async function placeEventApplication(
  society: number,
  venue: number,
  timeRange: [ string, string ],
  title: string,
  description: string,
  capacity: number | null
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
      `INSERT INTO "Society".EventApplication
       (Applicant, Society, Venue, TimeRange, Title, Description, Capacity)
       VALUES ($1, $2, $3, tstzrange($4, $5), $6, $7, $8)`,
      [ session.user.name, society, venue, new Date(timeRange[0]), new Date(timeRange[1]), title, description, capacity ]
    );
    if (!result.rowCount) {
      return null;
    }
    return result.rowCount;
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