import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  const baseUrl = process.env.SPRING_API_BASE_URL || 'http://localhost:8080';
  
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    
    const token = request.headers.get('cookie')?.split('; ').find(row => row.startsWith('vos_access_token='))?.split('=')[1];
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/api/bia-po-si-remittance-variance?${params.toString()}`, { headers });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching unified revenue reconciliation data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
