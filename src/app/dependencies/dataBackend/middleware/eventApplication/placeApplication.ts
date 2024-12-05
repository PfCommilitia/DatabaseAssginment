import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";
import { uuidv7 } from "uuidv7";

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