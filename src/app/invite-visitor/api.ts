import axios from "axios";
import { FRONTEND_URL } from "@/lib/server-urls";

export type InviteCompanyPayload = {
  companyName: string;
  phoneNo: string;
  email: string;
};

export type InviteCompanyResponse = {
  message: string;
  data: unknown;
};

export const inviteCompany = async (
  payload: InviteCompanyPayload
): Promise<InviteCompanyResponse> => {
  const authDataRaw = localStorage.getItem("authData");
  const authData = authDataRaw ? JSON.parse(authDataRaw) : {};
  const token = authData?.token || "";
  const response = await axios.post<InviteCompanyResponse>(
    `${FRONTEND_URL}/api/invite-visitor`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
