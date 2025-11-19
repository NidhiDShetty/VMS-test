import axios from "axios";
import { FRONTEND_URL } from "@/lib/server-urls";

export type CompanyInvitation = {
  invId: number;
  companyName: string;
  status: string;
  email?: string;
  phoneNo?: string;
  invitedDate?: string;
  // Add other fields as needed for the preview page
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
  const invitations = response.data.data || [];
  return invitations;
};

export const deleteCompanyInvitation = async (invId: number) => {
  const authDataRaw = localStorage.getItem("authData");
  const authData = authDataRaw ? JSON.parse(authDataRaw) : {};
  const token = authData?.token || "";
  const response = await axios.delete(
    `${FRONTEND_URL}/api/invite-visitor/${invId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
