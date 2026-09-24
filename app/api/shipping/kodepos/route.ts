import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ data: [] }, { status: 400 });
  }

  try {
    const res = await fetch(`https://kodepos.vercel.app/search?q=${encodeURIComponent(q)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      return NextResponse.json({ data: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching kodepos:', error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
