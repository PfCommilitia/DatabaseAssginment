import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError, { ERROR_PARSING_DATE } from "@/app/dependencies/error/database";
import { parse as parseRange } from "postgres-range";

export type EventApplication = [
  number, // uuid
  string, // applicant
  string, // society
  string, // venue
  [ string, string ], // timeRange
  string, // title
  string, // description
  boolean, // isActive
  number, // capacity
  string, // status
];

export default async function listEventApplication(
  filterStatus: ("approved" | "rejected" | "pending")[] | null,
  filterSocieties: number[] | null,
  filterOrganisations: number[] | null,
  filterOrganisationHierarchy: number[] | null,
  filterVenues: number[] | null,
  filterTimeRange: [ string, string ] | null,
  filterSelf: boolean | null,
  filterApplicants: number[] | null,
  filterActive: boolean | null
): Promise<EventApplication[]> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const conditions = [];
  const params: (string | number[] | Date | boolean)[] = [];
  if (filterSelf) {
    conditions.push(`ea.Applicant = $${ params.length + 1 }`);
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
  if (filterOrganisationHierarchy?.length) {
    conditions.push(
      `EXISTS (
         WITH RECURSIVE OrganisationHierarchy AS (
           SELECT o1.Uuid, o1.Parent
           FROM "Society".Organisation o1
           WHERE o1.Uuid = (
             SELECT s2.Organisation
             FROM "Society".Society s2
             WHERE s2.Uuid = ea.Society
          )
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
  if (filterSocieties?.length) {
    conditions.push(`ea.Society = ANY($${ params.length + 1 })`);
    params.push(filterSocieties);
  }
  if (filterVenues?.length) {
    conditions.push(`ea.Venue = ANY($${ params.length + 1 })`);
    params.push(filterVenues);
  }
  if (filterTimeRange) {
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
  if (filterActive !== null) {
    conditions.push(`ea.IsActive = $${ params.length + 1 }`);
    params.push(filterActive);
  }
  const query = `SELECT ea.Uuid,
                      i.Name AS Applicant,
                      s.Name AS Society,
                      v.Name AS Venue,
                      TimeRange,
                      Title,
                      ea.Description,
                      ea.IsActive,
                      ea.Capacity,
                      Result
               FROM "Society".EventApplication ea
                      LEFT OUTER JOIN "Society".EventApplicationApproval eaa
                                      ON ea.Uuid = eaa.Application
                      LEFT OUTER JOIN "Society".Individual i
                                      ON ea.Applicant = i.Username
                      LEFT OUTER JOIN "Society".Society s
                                      ON ea.Society = s.Uuid
                      LEFT OUTER JOIN "Society".Venue v
                                      ON ea.Venue = v.Uuid
               WHERE ${ conditions.length ? conditions.map(str => str.trim()).join(" AND ") : "TRUE" }`;
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
        result.push(row.isactive);
        result.push(row.capacity);
        result.push(row.result === null ? "pending" : (row.result ? "approved" : "rejected"));
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