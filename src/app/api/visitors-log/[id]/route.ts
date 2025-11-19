import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Extract Bearer token from headers
const extractToken = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
};

// Type for axios error response
interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
  message?: string;
}

// PATCH /api/visitors-log/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(req);

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: Bearer token missing' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Visitor ID is required' },
        { status: 400 }
      );
    }

    // Call the backend API
    const backendUrl = `http://localhost:1433/api/visitors/${id}`;
    const backendRes = await axios.patch(backendUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (err: unknown) {
    let status = 500;
    let message = 'Failed to update visitor';

    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      typeof (err as AxiosErrorResponse).response === 'object'
    ) {
      const response = (err as AxiosErrorResponse).response;
      status = response?.status || 500;
      message = response?.data?.error || message;
    }

    return NextResponse.json({ error: message }, { status });
  }
}