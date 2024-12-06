import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

type Organisation = [
  string, // uuid
  string, // name
  string, // Representative.Name
  string, // Parent.Name
];

export default async function listOrganisations(
  filterRepresentatives: string[] | null,
  filterHierarchy: string[] | null,
  filterParents: string[] | null,
  filterAncestors: string[] | null
): Promise<Organisation[]> {
  const conditions = [];
  const params: (string | string[] | Date)[] = [];
  if (filterRepresentatives?.length) {
    conditions.push(`o.Representative = ANY($${ params.length + 1 })`);
    params.push(filterRepresentatives);
  }
  if (filterHierarchy?.length) {
    conditions.push(
      `EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o1.Uuid, o1.Parent
            FROM "Society".Organisation o1
            WHERE o1.Uuid = o.Parent
          UNION ALL
          SELECT o2.Uuid, o2.Parent
            FROM "Society".Organisation o2
            JOIN OrganisationHierarchy oh
            ON oh.Parent = o2.Uuid
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE oh.Uuid = ANY($${ params.length + 1 })
      )`
    );
    params.push(filterHierarchy);
  }
  if (filterParents?.length) {
    conditions.push(`o.Parent = ANY($${ params.length + 1 })`);
    params.push(filterParents);
  }
  if (filterAncestors?.length) {
    conditions.push(
      `EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o1.Uuid, o1.Parent
            FROM "Society".Organisation o1
            WHERE o1.Uuid = o.Uuid
          UNION ALL
          SELECT o2.Uuid, o2.Parent
            FROM "Society".Organisation o2
            JOIN OrganisationHierarchy oh
            ON oh.Parent = o2.Uuid
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE oh.Uuid = ANY($${ params.length + 1 })
      )`
    );
    params.push(filterAncestors);
  }
  const query = `SELECT o.Uuid,
                        o.Name,
                        i.Name AS Representative,
                        p.Name AS Parent
                 FROM "Society".Organisation o
                        LEFT JOIN "Society".Individual i
                                  ON o.Representative = i.Username
                        LEFT OUTER JOIN "Society".Organisation p
                                        ON o.Parent = p.Uuid
                 WHERE ${ conditions.join(" AND ") }`;
  const client = await connect();
  try {
    const result = await client.query(query, params);
    if (result.rowCount === 0) {
      return [];
    }
    return result.rows.map(row => [
      row.Uuid,
      row.Name,
      row.Representative,
      row.Parent
    ]) as Organisation[];
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
