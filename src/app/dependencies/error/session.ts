import ServerError from "@/app/dependencies/error/errorType";

export const ERROR_SESSION_NOT_FOUND = new ServerError("No session found", 1);

export const ERROR_NO_USER_IN_SESSION = new ServerError("No user in session", 2);

export const ERROR_INCORRECT_USERNAME_OR_PASSWORD = new ServerError("Incorrect username or password", 3);