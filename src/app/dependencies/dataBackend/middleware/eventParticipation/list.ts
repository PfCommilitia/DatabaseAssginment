import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { parse as parseRange } from "postgres-range";
import processDBError, { ERROR_PARSING_DATE } from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";

export type EventParticipationApplication = [
  number, // uuid
  number, // target
  string, // applicant
  string, // society
  string, // venue
  string, // organiser
  [ string, string ], // timeRange
  string, // applicationTime
  string, // title
  string, // description
  boolean, // isActive
  string, // status
  string, // participationStatus
    string | null, // message
];

export default async function listEventParticipationApplications(
  filterStatus: ("approved" | "rejected" | "pending")[] | null,
  filterParticipationStatus: ("approved" | "rejected" | "pending")[] | null,
  filterEvents: number[] | null,
  filterSocieties: number[] | null,
  filterOrganisations: number[] | null,
  filterOrganisationHierarchy: number[] | null,
  filterOrganisers: string[] | null,
  filterVenues: number[] | null,
  filterTimeRange: [ string, string ] | null,
  filterApplicationTimeRange: [ string, string ] | null,
  filterApplicantSocieties: number[] | null,
  filterApplicantOrganisationHierarchy: number[] | null,
  filterApplicants: string[] | null,
  filterSelf: boolean | null,
  filterActive: boolean | null
): Promise<EventParticipationApplication[]> {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const conditions = [];
  const params: (string | string[] | number[] | Date | boolean)[] = [];
  if (filterSelf) {
    conditions.push(`epa.Applicant = $${ params.length + 1 }`);
    params.push(session.user.name);
  } else {
    conditions.push(
      `(
        ea.Applicant = $${ params.length + 1 } OR
        (SELECT s0.Representative FROM "Society".Society s0 WHERE s0.Uuid = ea.Society) = $${ params.length + 1 } OR
        EXISTS (
          WITH RECURSIVE OrganisationHierarchy AS (
            SELECT o0.Uuid, o0.Parent, o0.Representative
            FROM "Society".Organisation o0
            WHERE o0.Uuid = (SELECT s1.Organisation FROM "Society".Society s1 WHERE s1.Uuid = ea.Society)
            UNION
            SELECT o1.Uuid, o1.Parent, o1.Representative
            FROM "Society".Organisation o1
            JOIN OrganisationHierarchy oh
            ON o1.Uuid = oh.Parent
          )
          SELECT 1
          FROM OrganisationHierarchy oh
          WHERE oh.Representative = $${ params.length + 1 }
        )
      )
    `);
    params.push(session.user.name);
  }
  if (filterApplicants?.length) {
    conditions.push(`epa.Applicant = ANY($${ params.length + 1 })`);
    params.push(filterApplicants);
  }
  if (filterApplicantSocieties?.length) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM "Society".Membership m0
        m0.Individual = epa.Applicant AND m0.Society = ANY($${ params.length + 1 })
    `);
    params.push(filterApplicantSocieties);
  }
  if (filterApplicantOrganisationHierarchy?.length) {
    conditions.push(`
      EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o2.Uuid, o2.Parent
          FROM "Society".Organisation o2
          WHERE o2.Uuid = (
            SELECT s2.Organisation
            FROM "Society".Individual i0
            WHERE i0.Username = epa.Applicant
          )
          UNION
          SELECT o3.Uuid, o3.Parent
          FROM "Society".Organisation o3
          JOIN OrganisationHierarchy oh
          ON oh.Parent = o3.Uuid
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE oh.Uuid = ANY($${ params.length + 1 })
      )
    `);
    params.push(filterApplicantOrganisationHierarchy);
  }
  if (filterSocieties?.length) {
    conditions.push(`ea.Society = ANY($${ params.length + 1 })`);
    params.push(filterSocieties);
  }
  if (filterOrganisations?.length) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM "Society".Society s2
        WHERE s2.Uuid = ea.Society AND s2.Organisation = ANY($${ params.length + 1 }
      )
    `);
    params.push(filterOrganisations);
  }
  if (filterOrganisationHierarchy?.length) {
    conditions.push(`
      EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o4.Uuid, o4.Parent
          FROM "Society".Organisation o4
          WHERE o4.Uuid = (
            SELECT s3.Organisation
            FROM "Society".Society s3
            WHERE s3.Uuid = ea.Society
          )
          UNION
          SELECT o5.Uuid, o5.Parent
          FROM "Society".Organisation o5
          JOIN OrganisationHierarchy oh
          ON oh.Parent = o5.Uuid
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE oh.Uuid = ANY($${ params.length + 1 })
      )
    `);
    params.push(filterOrganisationHierarchy);
  }
  if (filterOrganisers?.length) {
    conditions.push(`ea.Applicant = ANY($${ params.length + 1 })`);
    params.push(filterOrganisers);
  }
  if (filterVenues?.length) {
    conditions.push(`ea.Venue = ANY($${ params.length + 1 })`);
    params.push(filterVenues);
  }
  if (filterTimeRange?.length) {
    conditions.push(`ea.TimeRange && TSTZRANGE($${ params.length + 1 }, $${ params.length + 2 })`);
    params.push(filterTimeRange[0]);
    params.push(filterTimeRange[1]);
  }
  if (filterApplicationTimeRange) {
    conditions.push(`epa.Timestamp && TSTZRANGE($${ params.length + 1 }, $${ params.length + 2 })`);
    params.push(filterApplicationTimeRange[0]);
    params.push(filterApplicationTimeRange[1]);
  }
  if (filterEvents?.length) {
    conditions.push(`ea.Uuid = ANY($${ params.length + 1 })`);
    params.push(filterEvents);
  }
  if (filterStatus?.length) {
    let condition = "(";
    for (let i = 0; i < filterStatus.length; i++) {
      condition += (() => {
        if (filterStatus[i] === "approved") {
          return `
            EXISTS (
              SELECT 1
              FROM "Society".EventApplicationApproval eaa0
              WHERE eaa0.Application = ea.Uuid AND eaa0.Result
            )
          `;
        }
        if (filterStatus[i] === "rejected") {
          return `
            EXISTS (
              SELECT 1
              FROM "Society".EventApplicationApproval eaa1
              WHERE eaa1.Application = ea.Uuid AND NOT eaa1.Result
            )
          `;
        }
        if (filterStatus[i] === "pending") {
          return `
            NOT EXISTS (
              SELECT 1
              FROM "Society".EventApplicationApproval eaa2
              WHERE eaa2.Application = ea.Uuid
            )
          `;
        }
      })();
      if (i < filterStatus.length - 1) {
        condition += " OR ";
      }
    }
    condition += ")";
    conditions.push(condition);
  }
  if (filterParticipationStatus?.length) {
    let condition = "(";
    for (let i = 0; i < filterParticipationStatus.length; i++) {
      condition += (() => {
        if (filterParticipationStatus[i] === "approved") {
          return `
            EXISTS (
              SELECT 1
              FROM "Society".EventParticipationApproval epaa0
              WHERE epaa0.Application = epa.Uuid AND epaa0.Result
            )
          `;
        }
        if (filterParticipationStatus[i] === "rejected") {
          return `
            EXISTS (
              SELECT 1
              FROM "Society".EventParticipationApproval epaa1
              WHERE epaa1.Application = epa.Uuid AND NOT epaa1.Result
            )
          `;
        }
        if (filterParticipationStatus[i] === "pending") {
          return `
            NOT EXISTS (
              SELECT 1
              FROM "Society".EventParticipationApproval epaa2
              WHERE epaa2.Application = epa.Uuid
            )
          `;
        }
      })();
      if (i < filterParticipationStatus.length - 1) {
        condition += " OR ";
      }
    }
    condition += ")";
    conditions.push(condition);
  }
  if (filterActive !== null) {
    conditions.push(`epa.IsActive = $${ params.length + 1 }`);
    params.push(filterActive);
  }
  const query = `
    SELECT epa.Uuid,
           epa.ApplyingEvent,
           i.Name        AS Applicant,
           s.Name        AS Society,
           v.Name        AS Venue,
           ea.Applicant  AS Organiser,
           ea.TimeRange,
           epa.Timestamp AS ApplicationTime,
           ea.Title,
           ea.Description,
           epa.IsActive,
           eaa.Result    AS Status,
           epaa.Result   AS ParticipationStatus,
           epaa.Comment
    FROM "Society".EventParticipationApplication epa
           LEFT OUTER JOIN "Society".Individual i ON epa.Applicant = i.Username
           LEFT OUTER JOIN "Society".EventApplication ea ON epa.ApplyingEvent = ea.uuid
           LEFT OUTER JOIN "Society".Society s ON ea.Society = s.Uuid
           LEFT OUTER JOIN "Society".Venue v ON ea.Venue = v.Uuid
           LEFT OUTER JOIN "Society".EventApplicationApproval eaa
                           ON ea.Uuid = eaa.Application
           LEFT OUTER JOIN "Society".EventParticipationApproval epaa
                           ON epa.Uuid = epaa.Application
    WHERE ${ conditions ? conditions.map(str => str.trim()).join(" AND ") : "TRUE" }
  `;
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
        result.push(row.applyingevent);
        result.push(row.applicant);
        result.push(row.society);
        result.push(row.venue);
        result.push(row.organiser);
        const timeRange = parseRange(row.timerange);
        if (!timeRange.lower || !timeRange.upper) {
          throw ERROR_PARSING_DATE;
        }
        result.push([ new Date(timeRange.lower).toString(), new Date(timeRange.upper).toString() ]);
        result.push(new Date(row.applicationtime).toString());
        result.push(row.title);
        result.push(row.description);
        result.push(row.isactive);
        result.push(row.status === null ? "pending" : (row.status ? "approved" : "rejected"));
        result.push(row.participationstatus === null ? "pending" : (row.participationstatus ? "approved" : "rejected"));
        result.push(row.comment);
        return result;
      }
    ) as EventParticipationApplication[];
  } catch (e) {
    if (!(e instanceof Error)) {
      throw ERROR_UNKNOWN;
    }
    console.log(e);
    e = processDBError(e);
    throw e;
  } finally {
    client.release();
  }
}