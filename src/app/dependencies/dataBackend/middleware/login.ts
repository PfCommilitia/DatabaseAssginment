import { connect } from "@/app/dependencies/dataBackend/dataSource";

export default async function login(username: string, password: string):
  Promise<{ id: string, name: string } | null> {
  const client = await connect();
  try {
    const result = await client.query(
      "SELECT Id, Name FROM Individuals WHERE Username = $1 AND PasswordHash =" +
      " CRYPT($2, PasswordHash);",
      [ username, password ]
    );
    if (result.rowCount) {
      return { id: result.rows[0].id, name: result.rows[0].name };
    }
    return null;
  } catch (e) {
    throw e;
  } finally {
    client.release();
  }
}