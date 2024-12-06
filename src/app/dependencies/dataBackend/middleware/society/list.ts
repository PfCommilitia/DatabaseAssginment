import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

export type Society = [
  string, // uuid
  string, // name
  string, // organisation
  boolean, // isActive
  string, // representative
  string, // imageUrl
  string // description
];

export default async function listSocieties(
  filterActive: boolean | null,
  filterRepresentatives: string[] | null,
  filterOrganisations: string[] | null,
  filterOrganisationHierarchy: string[] | null,
  filterManaged: boolean | null
): Promise<Society[]> {
  const conditions = [];
  const params: (string | string[] | boolean)[] = [];
  if (filterActive !== null) {
    conditions.push(`s.IsActive = $${ params.length + 1 }`);
    params.push(filterActive);
  }
  if (filterRepresentatives?.length) {
    conditions.push(`s.Representative = ANY($${ params.length + 1 })`);
    params.push(filterRepresentatives);
  }
  if (filterOrganisations?.length) {
    conditions.push(`s.Organisation = ANY($${ params.length + 1 })`);
    params.push(filterOrganisations);
  }
  if (filterOrganisationHierarchy) {
    conditions.push(
      `EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o1.Uuid, o1.Parent
            FROM "Society".Organisation o1
            WHERE o1.Uuid = s.Organisation
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
    params.push(filterOrganisationHierarchy);
  }
  if (filterManaged !== null) {
    conditions.push(`
      (s.Representative = $${ params.length + 1 } OR
      EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o1.Uuid, o1.Parent, o1.Representative
            FROM "Society".Organisation o1
            WHERE o1.Uuid = s.Organisation
          UNION
          SELECT o2.Uuid, o2.Parent, o2.Representative
            FROM "Society".Organisation o2
            JOIN OrganisationHierarchy oh
            ON oh.Parent = o2.Uuid
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE oh.Representative = $${ params.length + 1 })
    `);
    const session = await getServerSession();
    if (!session) {
      throw ERROR_SESSION_NOT_FOUND;
    }
    if (!session.user?.name) {
      throw ERROR_NO_USER_IN_SESSION;
    }
    params.push(session.user.name);
  }
  const query = `SELECT s.Uuid,
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
                 WHERE ${ conditions.length ? conditions.map(str => str.trim()).join(" AND ") : "TRUE" }`;
  const client = await connect();
  try {
    const result = await client.query(query, params);
    if (!result.rowCount) {
      return [];
    }
    return result.rows.map(row => [
      row.uuid,
      row.name,
      row.organisation,
      row.isactive,
      row.representative,
      row.imageurl,
      row.description
    ]) as Society[];
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