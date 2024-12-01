import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

export default async function login(username: string, password: string):
  Promise<{ id: string, name: string } | null> {
  const client = await connect();
  try {
    const result = await client.query(
      `SELECT 1 FROM "Society".Individual WHERE Username = $1 AND PasswordHash = CRYPT($2, PasswordHash) AND IsActive;`,
      [ username, password ]
    );
    if (result.rowCount) {
      return { id: username, name: username };
    }
    return null;
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