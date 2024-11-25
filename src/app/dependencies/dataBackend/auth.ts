// eslint-disable-next-line @typescript-eslint/no-unused-vars
import login from "@/app/dependencies/dataBackend/middleware/login";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function authorize(username: string, password: string) {
  // TODO: Once the database is functional, replace the dummy with the following code:
  // return await login(username, password);
  // TODO: Remember to clear all eslint disable comments.
  return { id: "0", name: username };
}