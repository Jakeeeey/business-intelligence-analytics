import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplierId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  const baseUrl = process.env.SPRING_API_BASE_URL || 'http://localhost:8080';

  try {
    const params = new URLSearchParams();
    
    if (supplierId) {
      params.append('supplierId', supplierId);
    }

    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }

    const token = request.headers.get('cookie')?.split('; ').find(row => row.startsWith('vos_access_token='))?.split('=')[1];

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const targetUrl = `${baseUrl}/api/po-si-remittance-detailed?${params.toString()}`;
    console.log(`[Proxy] Forwarding to: ${targetUrl}`);

    // Proxy to backend
    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Backend returned status ${response.status} for /api/po-si-remittance-detailed. Error:`, errorText);
      return NextResponse.json({ error: 'Backend error', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching detailed PO-SI-Remittance data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
