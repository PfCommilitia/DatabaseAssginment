import login from "@/app/dependencies/dataBackend/middleware/user/login";

export async function authorize(username: string, password: string) {
  return await login(username, password);
}