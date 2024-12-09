import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";
import getEventApplicationPermission
  from "@/app/dependencies/dataBackend/middleware/eventApplication/getPermission";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";

export type User = [
  string, // username
  string, // name
  boolean, // isActive
  boolean, // isInitialized
  string // organisation
]

export default async function listUser(
  filterOrganisation: number[] | null,
  filterOrganisationHierarchy: number[] | null,
  filterSocieties: number[] | null,
  filterActive: boolean | null,
  filterEvents: number[] | null
) {
  const session = await getServerSession();
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user?.name) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  const conditions = [];
  const params: (string | string[] | number[] | boolean)[] = [];
  conditions.push(`
    (i.Username = $${ params.length + 1 } OR EXISTS (
      WITH RECURSIVE OrganisationHierarchy AS (
        SELECT o0.Uuid, o0.Parent, o0.Representative
          FROM "Society".Organisation o0
          WHERE o0.Uuid = i.Organisation
        UNION
        SELECT o1.Uuid, o1.Parent, o1.Representative
          FROM "Society".Organisation o1
          JOIN OrganisationHierarchy oh
          ON o1.Uuid = oh.Parent
      )
      SELECT 1
      FROM OrganisationHierarchy oh
      WHERE Representative = $${ params.length + 1 }) OR EXISTS (
        SELECT 1
        FROM "Society".Society s0
        WHERE s0.Uuid = ANY(
          SELECT m0.Society
          FROM "Society".Membership m0
          WHERE m0.Individual = i.Username
        ) AND s0.Representative = $${ params.length + 1 }
      ) OR EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o2.Uuid, o2.Parent, o2.Representative
            FROM "Society".Organisation o2
            WHERE o2.Uuid = ANY(
              SELECT s0.Organisation
              FROM "Society".Society s0
              WHERE s0.Uuid = ANY(
                SELECT m0.Society
                FROM "Society".Membership m0
                WHERE m0.Individual = i.Username
              )
            )
          UNION
          SELECT o3.Uuid, o3.Parent, o3.Representative
            FROM "Society".Organisation o3
            JOIN OrganisationHierarchy oh
            ON o3.Uuid = oh.Parent
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE Representative = $${ params.length + 1 }
      ))
  `);
  params.push(session.user.name);
  if (filterOrganisation) {
    conditions.push(`i.Organisation = ANY($${ params.length + 1 })`);
    params.push(filterOrganisation);
  }
  if (filterOrganisationHierarchy) {
    conditions.push(`
      EXISTS (
        WITH RECURSIVE OrganisationHierarchy AS (
          SELECT o1.Uuid, o1.Parent, o1.Representative
            FROM "Society".Organisation o1
            WHERE o1.Uuid = i.Organisation
          UNION
          SELECT o2.Uuid, o2.Parent, o2.Representative
            FROM "Society".Organisation o2
            JOIN OrganisationHierarchy oh
            ON o2.Uuid = oh.Parent
        )
        SELECT 1
        FROM OrganisationHierarchy oh
        WHERE Uuid = ANY($${ params.length + 1 })
      )
    `);
    params.push(filterOrganisationHierarchy);
  }
  if (filterSocieties?.length) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM "Society".Membership m
        WHERE m.Individual = i.Username AND m.Society = ANY($${ params.length + 1 })
      )`
    );
    params.push(filterSocieties);
  }
  if (filterEvents?.length) {
    for (const event of filterEvents) {
      const permission = await getEventApplicationPermission(event);
      if (permission === null) {
        throw ERROR_USER_NOT_PERMITTED;
      }
    }
    conditions.push(`
          EXISTS (
                SELECT 1
                FROM "Society".EventApplication ea0
                JOIN "Society".EventParticipationApplication epa0
                ON ea0.Uuid = epa0.ApplyingEvent
                WHERE ea0.Applicant = i.Username AND ea0.Uuid = ANY($${ params.length + 1 })
                  AND EXISTS (
                    SELECT 1 FROM "Society".EventParticipationApproval epa1
                    WHERE epa1.Application = epa0.Uuid AND Result
                  )
          )`
    );
    params.push(filterEvents);
  }
  if (filterActive !== null) {
    conditions.push(`i.IsActive = $${ params.length + 1 }`);
    params.push(filterActive);
  }
  const query = `
    SELECT i.Username, i.Name, i.IsActive, i.IsInitialized, o.Name AS Organisation
    FROM "Society".Individual i
           LEFT OUTER JOIN "Society".Organisation o ON i.Organisation = o.Uuid
    WHERE ${ conditions.length ? conditions.map(str => str.trim()).join(" AND ") : "TRUE" }
  `;
  const client = await connect();
  try {
    const result = await client.query(query, params);
    if (!result.rowCount) {
      return [];
    }
    return result.rows.map(row => [
      row.username,
      row.name,
      row.isactive,
      row.isinitialized,
      row.organisation
    ]) as User[];
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