import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError, { ERROR_PARSING_DATE } from "@/app/dependencies/error/database";
import { parse as parseRange } from "postgres-range";

type EventApplication = [
  string, // uuid
  string, // applicant
  string, // society
  string, // venue
  [ string, string ], // timerange
  string, // title
  string, // description
  number // capacity
];

export default async function listEventApplication(
  filterStatus: ("approved" | "rejected" | "pending")[] | null,
  filterSocieties: string[] | null,
  filterOrganisations: string[] | null,
  filterOrganisationHeirarchy: string[] | null,
  filterVenues: string[] | null,
  filterTimeRange: [ string, string ] | null,
  filterSelf: boolean | null,
  filterApplicants: string | null
): Promise<EventApplication[]> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const conditions = [];
  const params: (string | string[] | Date)[] = [];
  if (filterSelf) {
    conditions.push(`ea.Applicant = $${ params.length + 1 }`);
    params.push(session.user.name);
  } else {
    conditions.push(
      `EXISTS (
        WITH RECURSIVE OrganisationHeirarchy AS (
          SELECT o1.Uuid, o1.Parent
            FROM "Society".Organisation o1
            WHERE o1.Uuid = (
              SELECT v2.Organisation
              FROM "Society".Venue v2
              WHERE v2.Uuid = ea.Society
            )
          UNION ALL
          SELECT o2.Uuid, o2.Parent
            FROM "Society".Organisation o2
            JOIN OrganisationHeirarchy oh
            ON oh.Parent = o2.Uuid
        )
        SELECT 1
        FROM OrganisationHeirarchy oh
        WHERE oh.Representative = $${ params.length + 1 }
      )`
    );
    params.push(session.user.name);
  }
  if (filterApplicants?.length) {
    conditions.push(`ea.Applicant = ANY($${ params.length + 1 })`);
    params.push(filterApplicants);
  }
  if (filterOrganisations?.length) {
    conditions.push(
      `EXISTS (
        SELECT 1
        FROM "Society".Society s1
        WHERE s1.Uuid = ea.Society AND s1.Organisation = ANY($${ params.length + 1 })
      )`
    );
    params.push(filterOrganisations);
  }
  if (filterOrganisationHeirarchy?.length) {
    conditions.push(
      `EXISTS (
         WITH RECURSIVE OrganisationHeirarchy AS (
           SELECT o1.Uuid, o1.Parent
           FROM "Society".Organisation o1
           WHERE o1.Uuid = (
             SELECT s2.Organisation
             FROM "Society".Society s2
             WHERE s2.Uuid = ea.Society
          )
         UNION ALL
         SELECT o2.Uuid, o2.Parent
         FROM "Society".Organisation o2
          JOIN OrganisationHeirarchy oh
            ON oh.Parent = o2.Uuid
        )
        SELECT 1
        FROM OrganisationHeirarchy oh
        WHERE oh.Uuid = ANY($${ params.length + 1 })
      )`
    );
    params.push(filterOrganisationHeirarchy);
  }
  if (filterSocieties?.length) {
    conditions.push(`ea.Society = ANY($${ params.length + 1 })`);
    params.push(filterSocieties);
  }
  if (filterVenues?.length) {
    conditions.push(`ea.Venue = ANY($${ params.length + 1 })`);
    params.push(filterVenues);
  }
  if (filterTimeRange?.length) {
    conditions.push(`ea.TimeRange && tstzrange($${ params.length + 1 }, $${ params.length + 2 })`);
    params.push(new Date(filterTimeRange[0]));
    params.push(new Date(filterTimeRange[1]));
  }
  if (filterStatus?.length) {
    let condition = "(";
    for (let i = 0; i < filterStatus.length; i += 1) {
      condition += (() => {
        if (filterStatus[i] === "approved") {
          return `EXISTS (SELECT 1
                        FROM "Society".EventApplicationApproval eaa1
                        WHERE eaa1.Application = ea.Uuid
                          AND Result)`;
        }
        if (filterStatus[i] === "rejected") {
          return `EXISTS (SELECT 1
                        FROM "Society".EventApplicationApproval eaa2
                        WHERE eaa2.Application = ea.Uuid
                          AND Result = FALSE)`;
        }
        if (filterStatus[i] === "pending") {
          return `NOT EXISTS (SELECT 1
                            FROM "Society".EventApplicationApproval eaa3
                            WHERE eaa3.Application = ea.Uuid)`;
        }
      })();
      if (i < filterStatus.length - 1) {
        condition += ` OR `;
      }
    }
    condition += `)`;
    conditions.push(condition);
  }
  const query = `SELECT ea.Uuid,
                      i.Name,
                      s.Name,
                      v.Name,
                      TimeRange,
                      Title,
                      ea.Description,
                      ea.Capacity,
                      Result
               FROM "Society".EventApplication ea
                      LEFT OUTER JOIN "Society".EventApplicationApproval eaa
                                      ON Uuid = Application
                      LEFT OUTER JOIN "Society".Individual i
                                      ON Applicant = Username
                      LEFT OUTER JOIN "Society".Society s
                                      ON Society = s.Uuid
                      LEFT OUTER JOIN "Society".Venue v
                                      ON Venue = v.Uuid
               WHERE ${ conditions.join(" AND ") }`;
  const client = await connect();
  try {
    const result = await client.query(query, params);
    if (!result.rowCount) {
      return [];
    }
    return result.rows.map(
      row => {
        const result = [];
        result.push(row.uuid);
        result.push(row.applicant);
        result.push(row.society);
        result.push(row.venue);
        const timeRange = parseRange(row.timerange);
        if (!timeRange.lower || !timeRange.upper) {
          throw ERROR_PARSING_DATE;
        }
        result.push([ new Date(timeRange.lower).toString(), new Date(timeRange.upper).toString() ]);
        result.push(row.title);
        result.push(row.description);
        result.push(row.capacity);
        return result as EventApplication;
      }
    );
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