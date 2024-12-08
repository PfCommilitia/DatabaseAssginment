import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";

export type Organisation = [
  number, // uuid
  string, // name
  string, // Representative.Name
  string, // Parent.Name
  boolean, // IsActive
];

export default async function listOrganisations(
  filterRepresentatives: string[] | null,
  filterHierarchy: number[] | null,
  filterParents: number[] | null,
  filterAncestors: number[] | null,
  filterManaged: boolean | null,
  filterActive: boolean | null
): Promise<Organisation[]> {
  const conditions = [];
  const params: (string | string[] | number[] | boolean)[] = [];
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
          UNION
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
          UNION
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
  if (filterManaged) {
    const session = await getServerSession();
    if (!session) {
      throw ERROR_SESSION_NOT_FOUND;
    }
    if (!session.user?.name) {
      throw ERROR_NO_USER_IN_SESSION;
    }
    conditions.push(`
      EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o3.Uuid, o3.Parent
            FROM "Society".Organisation o3
            WHERE o3.Uuid = o.Uuid
          UNION
          SELECT o4.Uuid, o4.Parent
            FROM "Society".Organisation o4
            JOIN OrganisationHierarchy oh
            ON oh.Parent = o4.Uuid
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE oh.Representative = $${ params.length + 1 }
      )
    `);
    params.push(session.user.name);
  }
  if (filterActive !== null) {
    conditions.push(`o.IsActive = $${ params.length + 1 }`);
    params.push(filterActive);
  }
  const query = `SELECT o.Uuid,
                        o.Name,
                        i.Name AS Representative,
                        p.Name AS Parent,
                        o.IsActive
                 FROM "Society".Organisation o
                        LEFT OUTER JOIN "Society".Individual i
                                  ON o.Representative = i.Username
                        LEFT OUTER JOIN "Society".Organisation p
                                        ON o.Parent = p.Uuid
                 WHERE ${ conditions.length ? conditions.map(str => str.trim()).join(" AND ") : "TRUE" }`;
  const client = await connect();
  try {
    const result = await client.query(query, params);
    if (result.rowCount === 0) {
      return [];
    }
    return result.rows.map(row => [
      row.uuid,
      row.name,
      row.representative,
      row.parent,
      row.isactive
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
