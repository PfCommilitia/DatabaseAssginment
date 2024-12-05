import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import listEventParticipationApplications
  from "@/app/dependencies/dataBackend/middleware/eventParticipation/list";

export async function POST(request: Request) {
  try {
    const {
      filterStatus,
      filterParticipationStatus,
      filterEvents,
      filterSocieties,
      filterOrganisations,
      filterOrganisationHierarchy,
      filterOrganisers,
      filterVenues,
      filterTimeRange,
      filterApplicationTimeRange,
      filterApplicantSocieties,
      filterApplicantOrganisationHierarchy,
      filterApplicants,
      filterSelf
    } = await request.json();
    const result = await listEventParticipationApplications(
      filterStatus,
      filterParticipationStatus,
      filterEvents,
      filterSocieties,
      filterOrganisations,
      filterOrganisationHierarchy,
      filterOrganisers,
      filterVenues,
      filterTimeRange,
      filterApplicationTimeRange,
      filterApplicantSocieties,
      filterApplicantOrganisationHierarchy,
      filterApplicants,
      filterSelf
    );
    return NextResponse.json({ payload: result }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
