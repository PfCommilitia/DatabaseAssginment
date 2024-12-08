import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { Society } from "@/app/dependencies/dataBackend/middleware/society/list";

export default async function acquireSocietyState(society: number) {
  const client = await connect();
  try {
    const result = await client.query(
      `SELECT s.Uuid,
              s.Name,
              o.Name AS Organisation,
              s.IsActive,
              i.Name AS Representative,
              s.ImageURL,
              s.Description
       FROM "Society".Society s
              LEFT OUTER JOIN "Society".Organisation o ON s.Organisation = o.Uuid
              LEFT OUTER JOIN "Society".Individual i
                              ON s.Representative = i.Username
       WHERE s.Uuid = $1`,
      [ society ]
    );
    if (!result.rowCount) {
      return null;
    }

    const row = result.rows[0];
    return [
      row.uuid,
      row.name,
      row.organisation,
      row.isactive,
      row.representative,
      row.imageurl,
      row.description
    ] as Society;
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
