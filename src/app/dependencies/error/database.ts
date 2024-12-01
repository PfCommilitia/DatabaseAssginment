export default function processDBError(error: Error) {
  // Process error message from database; return the error itself if not an error from
  // database triggers
  return error;
}