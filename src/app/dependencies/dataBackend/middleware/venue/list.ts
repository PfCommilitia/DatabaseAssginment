import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

type Venue = [
  string, // uuid
  string, // name
  string, // address
  string, // description
  boolean, // isAvailable
  string, // Organisation.Name
  number, // capacity
  string, // imageURL
];

export default async function listVenues(
  filterAvailable: boolean | null,
  filterOrganisations: string[] | null,
  filterOrganisationHierarchy: string[] | null,
  filterTimeRangeAvailability: [ string, string ] | null
) {
  const conditions = [];
  const params: (boolean | string | string[] | Date)[] = [];
  if (filterAvailable !== null) {
    conditions.push(`v.IsAvailable = $${ params.length + 1 }`);
    params.push(filterAvailable);
  }
  if (filterOrganisations?.length) {
    conditions.push(`v.Organisation = ANY($${ params.length + 1 })`);
    params.push(filterOrganisations);
  }
  if (filterOrganisationHierarchy) {
    conditions.push(
      `EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o1.Uuid, o1.Parent
            FROM "Society".Organisation o1
            WHERE o1.Uuid = v.Organisation
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
  if (filterTimeRangeAvailability) {
    conditions.push(
      `NOT EXISTS (
        SELECT 1
        FROM "Society".EventApplication ea
        WHERE ea.Venue = v.Uuid
          AND ea.TimeRange && TSTZRANGE($${ params.length + 1 }, $${ params.length + 2 })
          AND EXISTS (
            SELECT 1
            FROM "Society".EventApplicationApproval eaa
            WHERE eaa.Result
          )
      )`
    );
    params.push(new Date(filterTimeRangeAvailability[0]));
    params.push(new Date(filterTimeRangeAvailability[1]));
  }
  const query = `SELECT v.Uuid,
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
                 WHERE ${ conditions.join(" AND ") }`;
  const client = await connect();
  try {
    const result = await client.query(query, params);
    if (result.rowCount === 0) {
      return [];
    }
    return result.rows.map(row => [
      row.uuid,
      row.name,
      row.address,
      row.description,
      row.isAvailable,
      row.organisationname,
      row.capacity,
      row.imageurl
    ]) as Venue[];
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