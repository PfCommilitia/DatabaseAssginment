import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { Venue } from "@/app/dependencies/dataBackend/middleware/venue/list";

export default async function acquireVenueState(venue: number) {
  const client = await connect();
  try {
    const result = await client.query(
      `SELECT v.Uuid,
              v.Name,
              v.Address,
              v.Description,
              v.IsAvailable,
              o.Name AS OrganisationName,
              v.Capacity,
              v.ImageURL
       FROM "Society".Venue v
              LEFT OUTER JOIN "Society".Organisation o
                              ON v.Organisation = o.Uuid
       WHERE v.Uuid = $1`,
      [ venue ]
    );
    if (!result.rowCount) {
      return null;
    }

    const row = result.rows[0];
    return [
      row.uuid,
      row.name,
      row.address,
      row.description,
      row.isAvailable,
      row.organisationname,
      row.capacity,
      row.imageurl
    ] as Venue;
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
