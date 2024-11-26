import { connect } from "@/app/dependencies/dataBackend/dataSource";

export default async function fetchUserInfo(username: string):
Promise<{ username: string, name: string, portraitURL: string } | null> {
  const client = await connect();
  try {
    const result = await client.query(
      "SELECT Username, Name, PortraitURL FROM Individual WHERE Username = $1;",
      [ username ]
    );
    if (result.rowCount) {
      return {
        username: result.rows[0].username,
        name: result.rows[0].name,
        portraitURL: result.rows[0].portraiturl
      };
    }
    return null;
  } catch (e) {
    throw e;
  } finally {
    client.release();
  }
}