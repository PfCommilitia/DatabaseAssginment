import { connect } from "@/app/dependencies/dataBackend/dataSource";
import processDBError from "@/app/dependencies/error/database";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import { ERROR_USER_NOT_PERMITTED } from "@/app/dependencies/error/databaseTrigger";
import getSocietyPermission
  from "@/app/dependencies/dataBackend/middleware/society/getPermission";

export default async function editSociety(
  society: string,
  name: string,
  description: string
):
  Promise<number | null> {
  const client = await connect();
  try {
    if (await getSocietyPermission(society) === null) {
      throw ERROR_USER_NOT_PERMITTED;
    }
    const result = await client.query(
      `UPDATE "Society".Society
       SET Name = $1,
           Description = $2
       WHERE Uuid = $3`,
      [ name, description, society ]
    );
    if (result.rowCount === 0) {
      return null;
    }
    return result.rowCount;
  } catch (e) {
    if (!(e instanceof Error)) {
      throw ERROR_UNKNOWN;
    }
    console.log(e.message);
    e = processDBError(e);
    throw e;
  } finally {
    client.release();
  }
}
