import ServerError from "@/app/dependencies/error/errorType";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";

export default function processDBError(error: Error): ServerError {
  // Process error message from database; return the error itself if not an error from
  // database triggers
  if (error instanceof ServerError) {
    return error;
  }
  return ERROR_UNKNOWN;
}

export const ERROR_DB_COMMUNICATION = new ServerError("Error communicating with the database", 4);