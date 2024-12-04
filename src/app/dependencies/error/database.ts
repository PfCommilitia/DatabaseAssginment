import ServerError from "@/app/dependencies/error/errorType";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import * as DBTriggerErrors from "@/app/dependencies/error/databaseTrigger";

const trigger_errors: Record<string, ServerError> = {
  "5": DBTriggerErrors.ERROR_INVALID_PASSWORD,
  "6": DBTriggerErrors.ERROR_MOVING_TO_INACTIVE_ORGANISATION,
  "7": DBTriggerErrors.ERROR_FIELD_NOT_EDITABLE,
  "8": DBTriggerErrors.ERROR_NO_ACTIVE_REPRESENTATIVE,
  "9": DBTriggerErrors.ERROR_DEACTIVATING_WITH_ACTIVE_MEMBERS,
  "10": DBTriggerErrors.ERROR_REPRESENTATIVE_NOT_IN_HEIRARCHY,
  "11": DBTriggerErrors.ERROR_INACTIVE_USER,
  "12": DBTriggerErrors.ERROR_INACTIVE_SOCIETY,
  "13": DBTriggerErrors.ERROR_ALREADY_A_MEMBER,
  "14": DBTriggerErrors.ERROR_DUPLICATE_APPLICATION,
  "15": DBTriggerErrors.ERROR_ALREADY_CANCELLED,
  "16": DBTriggerErrors.ERROR_ALREADY_PROCESSED,
  "17": DBTriggerErrors.ERROR_USER_NOT_PERMITTED,
  "18": DBTriggerErrors.ERROR_UNAVAILABLE_VENUE,
  "19": DBTriggerErrors.ERROR_VENUE_OCCUPIED,
  "20": DBTriggerErrors.ERROR_CONFLICTING_APPLICATION,
  "21": DBTriggerErrors.ERROR_EVENT_FULL
}

export const ERROR_DB_COMMUNICATION = new ServerError("Error communicating with the database", 4);

const EXCEPTION_PREFIX_LENGTH = "TRIGGER EXCEPTION ".length;

export default function processDBError(error: Error): ServerError {
  // Process error message from database; return the error itself if not an error from
  // database triggers
  if (error instanceof ServerError) {
    return error;
  }

  if (!error.message.startsWith("TRIGGER EXCEPTION")) {
    return ERROR_UNKNOWN;
  }

  const code = error.message.split(":")[0].slice(EXCEPTION_PREFIX_LENGTH);

  return trigger_errors[code] ?? ERROR_UNKNOWN;
}