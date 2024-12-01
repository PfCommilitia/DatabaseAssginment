import ServerError from "@/app/dependencies/error/errorType";

export const ERROR_UNKNOWN = new ServerError("An unknown error occurred; it cannot be" +
  " handled by the application", 0);