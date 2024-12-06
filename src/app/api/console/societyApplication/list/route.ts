import { NextResponse } from "next/server";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import ServerError from "@/app/dependencies/error/errorType";
import listSocietyApplication
  from "@/app/dependencies/dataBackend/middleware/societyApplication/list";

export async function POST(request: Request) {
  try {
    const {
      filterStatus,
      filterSocieties,
      filterOrganisations,
      filterOrganisationHierarchy,
      filterApplicants,
      filterApplicantOrganisationHierarchy,
      filterApplicationTimeRange,
      filterSelf,
      filterActive
    } = await request.json();
    const result = await listSocietyApplication(
      filterStatus,
      filterSocieties,
      filterOrganisations,
      filterOrganisationHierarchy,
      filterApplicants,
      filterApplicantOrganisationHierarchy,
      filterApplicationTimeRange,
      filterSelf,
      filterActive
    );
    return NextResponse.json({ payload: result }, { status: 200 });
  } catch (e) {
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
