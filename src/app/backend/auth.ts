// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function authorize(username: string, password: string) {
  // TODO: Integrate this with local user database; returning a dummy user for now
  return { id: "0", name: "Anonymous" };
}