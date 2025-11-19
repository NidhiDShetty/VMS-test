import { VISITOR_REPORT_API, VISITOR_REPORT_BY_HOST_API } from "@/lib/server-urls";

export type VisitorReports = {
  fromDate: string,
  toDate: string,
  reportType: string
}

export const visitorReport = async (
  reportData: VisitorReports
) => {
  const response = await fetch(VISITOR_REPORT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return await response.json();
};

export const visitorReportByHost = async (
  reportData: VisitorReports,
  token: string
) => {
  const response = await fetch(VISITOR_REPORT_BY_HOST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return await response.json();
};
