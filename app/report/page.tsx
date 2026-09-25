import { getReportData } from "../lib/reports";
import { ReportStudioClient } from "./ReportStudioClient";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const data = await getReportData();

  return <ReportStudioClient data={data} />;
}
