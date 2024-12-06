import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { Organisation } from "@/app/dependencies/dataBackend/middleware/organisation/list";

export default async function acquireOrganisationState(organisation: string) {
  const client = await connect();
  try {
    const result = await client.query(
      `SELECT o.Uuid,
              o.Name,
              i.Name AS Representative,
              p.Name AS Parent
       FROM "Society".Organisation o
              LEFT OUTER JOIN "Society".Individual i
                              ON o.Representative = i.Username
              LEFT OUTER JOIN "Society".Organisation p
                              ON o.Parent = p.Uuid
       WHERE o.Uuid = $1`,
      [ organisation ]
    );
    if (!result.rowCount) {
      return null;
    }

    const row = result.rows[0];
    return [
      row.Uuid,
      row.Name,
      row.Representative,
      row.Parent
    ] as Organisation;
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
