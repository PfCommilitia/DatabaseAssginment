import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

type SocietyApplication = [
  string, // uuid
  string, // applicant
  string, // society
  string, // description
  boolean, // isActive
  string, // status
  string, // timestamp
];

export default async function listSocietyApplication(
  filterStatus: ("approved" | "rejected" | "pending")[] | null,
  filterSocieties: string[] | null,
  filterOrganisations: string[] | null,
  filterOrganisationHierarchy: string[] | null,
  filterApplicants: string | null,
  filterApplicantOrganisationHierarchy: string[] | null,
  filterApplicationTimeRange: [ string, string ] | null,
  filterSelf: boolean | null,
  filterActive: boolean | null
) {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const conditions = [];
  const params: (string | string[] | Date | boolean)[] = [];
  if (filterSelf) {
    conditions.push(`sa.Applicant = $${ params.length + 1 }`);
    params.push(session.user.name);
  } else {
    conditions.push(
      `(
        sa.Applicant = $${ params.length + 1 } OR
        (SELECT s0.Representative FROM "Society".Society s0 WHERE s0.Uuid = sa.Society) = $${ params.length + 1 } OR
        EXISTS (
          WITH RECURSIVE OrganisationHierarchy AS (
            SELECT o0.Uuid, o0.Parent, o0.Representative
              FROM "Society".Organisation o0
              WHERE o0.Uuid = (
                SELECT s1.Organisation
                FROM "Society".Society s1
                WHERE s1.Uuid = sa.Society
              )
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
      )`
    );
    params.push(session.user.name);
  }
  if (filterApplicants?.length) {
    conditions.push(`sa.Applicant = ANY($${ params.length + 1 })`);
    params.push(filterApplicants);
  }
  if (filterApplicantOrganisationHierarchy?.length) {
    conditions.push(
      `EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o2.Uuid, o2.Parent
            FROM "Society".Organisation o2
            WHERE o2.Uuid = (SELECT i0.Organisation FROM "Society".Individual i0 WHERE i0.Username = sa.Applicant)
          UNION
          SELECT o3.Uuid, o3.Parent
            FROM "Society".Organisation o3
            JOIN OrganisationHierarchy oh
            ON o3.Parent = oh.Uuid
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE oh.Uuid = ANY($${ params.length + 1 })
      )`
    );
    params.push(filterApplicantOrganisationHierarchy);
  }
  if (filterSocieties?.length) {
    conditions.push(`sa.Society = ANY($${ params.length + 1 })`);
    params.push(filterSocieties);
  }
  if (filterOrganisations?.length) {
    conditions.push(
      `EXISTS (
        SELECT 1
        FROM "Society".Society s2
        WHERE s2.Uuid = sa.Society AND s2.Organisation = ANY($${ params.length + 1 })
      )`
    );
    params.push(filterOrganisations);
  }
  if (filterOrganisationHierarchy?.length) {
    conditions.push(
      `EXISTS (
          WITH RECURSIVE OrganisationHierarchy AS (
            SELECT o4.Uuid, o4.Parent
              FROM "Society".Organisation o4
              WHERE o4.Uuid = (
                SELECT s3.Organisation
                  FROM "Society".Society s3
                  WHERE s3.Uuid = sa.Society
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
      )`
    );
    params.push(filterOrganisationHierarchy);
  }
  if (filterApplicationTimeRange) {
    conditions.push(`sa.Timestamp && TSTZRANGE($${ params.length + 1 }, $${ params.length + 2 })`);
    params.push(new Date(filterApplicationTimeRange[0]));
    params.push(new Date(filterApplicationTimeRange[1]));
  }
  if (filterStatus?.length) {
    let condition = "(";
    for (let i = 0; i < filterStatus.length; i++) {
      condition += (() => {
        if (filterStatus[i] === "approved") {
          return `
            EXISTS (
              SELECT 1
              FROM "Society".SocietyApplicationApproval saa0
              WHERE saa0.Application = sa.Uuid AND saa0.Result
          `;
        }
        if (filterStatus[i] === "rejected") {
          return `
            EXISTS (
              SELECT 1
              FROM "Society".SocietyApplicationApproval saa1
              WHERE saa1.Application = sa.Uuid AND NOT saa1.Result
          `;
        }
        if (filterStatus[i] === "pending") {
          return `
            NOT EXISTS (
              SELECT 1
              FROM "Society".EventApplicationApproval saa2
              WHERE saa2.Application = sa.Uuid
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
  if (filterActive !== null) {
    conditions.push(`sa.IsActive = $${ params.length + 1 }`);
    params.push(filterActive);
  }
  const query = `SELECT sa.Uuid,
                        i.Username,
                        s.Name,
                        sa.Description,
                        sa.IsActive,
                        saa.Result,
                        sa.Timestamp
                 FROM "Society".SocietyApplication sa
                        LEFT OUTER JOIN "Society".SocietyApplicationApproval saa
                                        ON saa.Application = sa.Uuid
                        LEFT OUTER JOIN "Society".Individual i ON i.Username = sa.Applicant
                        LEFT OUTER JOIN "Society".Society s ON s.Uuid = sa.Society
                 WHERE ${ conditions.length ? conditions.map(str => str.trim()).join(" AND "): "TRUE" }`;
  const client = await connect();
  try {
    const result = await client.query(query, params);
    if (!result.rowCount) {
      return [];
    }
    return result.rows.map(row => {
      const result = [];
      result.push(row.Uuid);
      result.push(row.Applicant);
      result.push(row.Society);
      result.push(row.Description);
      result.push(row.IsActive);
      result.push(row.Result === null ? "pending" : (row.Result ? "approved" : "rejected"));
      result.push(new Date(row.Timestamp).toString());
      return result;
    }) as SocietyApplication[];
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