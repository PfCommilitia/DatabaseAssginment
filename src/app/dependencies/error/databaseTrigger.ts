// Database Trigger Errors Go Here

import ServerError from "@/app/dependencies/error/errorType";

export const ERROR_INVALID_PASSWORD = new ServerError("Invalid password", 5);

export const ERROR_MOVING_TO_INACTIVE_ORGANISATION = new ServerError(
  "Inactive organisation",
  6
);

export const ERROR_FIELD_NOT_EDITABLE = new ServerError(
  "Field not editable",
  7
);

export const ERROR_NO_ACTIVE_REPRESENTATIVE = new ServerError(
  "No active representative",
  8
);

export const ERROR_DEACTIVATING_WITH_ACTIVE_MEMBERS = new ServerError(
  "Deactivating with active members",
  9
);

export const ERROR_REPRESENTATIVE_NOT_IN_HEIRARCHY = new ServerError(
  "Representative not in hierarchy",
  10
);

export const ERROR_INACTIVE_USER = new ServerError("Inactive user", 11);

export const ERROR_INACTIVE_SOCIETY = new ServerError("Inactive society", 12);

export const ERROR_ALREADY_A_MEMBER = new ServerError("Already a member", 13);

export const ERROR_DUPLICATE_APPLICATION = new ServerError(
  "Duplicate application",
  14
);

export const ERROR_ALREADY_CANCELLED = new ServerError("Already cancelled", 15);

export const ERROR_ALREADY_PROCESSED = new ServerError("Already processed", 16);

export const ERROR_USER_NOT_PERMITTED = new ServerError(
  "User not permitted",
  17
);

export const ERROR_UNAVAILABLE_VENUE = new ServerError("Unavailable venue", 18);

export const ERROR_VENUE_OCCUPIED = new ServerError("Venue occupied", 19);

export const ERROR_CONFLICTING_APPLICATION = new ServerError(
  "Conflicting application",
  20
);

export const ERROR_EVENT_FULL = new ServerError("Event full", 21);

export const ERROR_TOO_SIMPLE_PASSWORD = new ServerError("Too simple password", 24);
