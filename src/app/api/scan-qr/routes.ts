import { VISITOR_CHECK_IN_API } from "@/lib/server-urls";

export const fetchVisitorQR = async (visitorId: string, token: string) => {
  const res = await fetch(VISITOR_CHECK_IN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: visitorId }),
  });
  if (!res.ok) throw new Error("Failed to fetch QR/OTP");
  return res.json();
};
