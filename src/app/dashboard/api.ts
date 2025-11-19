import axios from "axios";
import { FRONTEND_URL } from "@/lib/server-urls";

export type CompanyInvitation = {
  status: string;
  // ...other fields as needed
};

export const fetchCompanyInvitations = async (): Promise<
  CompanyInvitation[]
> => {
  const authDataRaw = localStorage.getItem("authData");
  const authData = authDataRaw ? JSON.parse(authDataRaw) : {};
  const token = authData?.token || "";
  const response = await axios.get(`${FRONTEND_URL}/api/invite-visitor`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};
