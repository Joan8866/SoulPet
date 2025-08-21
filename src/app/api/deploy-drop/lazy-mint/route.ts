import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// POST /api/deploy-drop/lazy-mint
// Body: { chainId?: number, contractId: string, assetName: string, assetDescription?: string, assetImageUrl: string, amount: number }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const secretKey = process.env.LOOTEX_SECRET_KEY;
    const apiBase = process.env.LOOTEX_API_BASE || 'https://local-api.lootex.dev';

    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Server misconfigured: missing LOOTEX_SECRET_KEY' },
        { status: 500 }
      );
    }

    const payload = {
      chainId: Number(body.chainId || process.env.LOOTEX_CHAIN_ID || 1868),
      contractId: body.contractId,
      assetName: body.assetName,
      assetDescription: body.assetDescription,
      assetImageUrl: body.assetImageUrl,
      amount: Number(body.amount || 1),
    };

    if (!payload.contractId || !payload.assetName || !payload.assetImageUrl) {
      return NextResponse.json(
        { success: false, message: 'contractId, assetName, assetImageUrl are required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${apiBase}/v1/project-wallet/deploy-drop/lazy-mint`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // @ts-expect-error next
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Lootex lazy-mint error:', res.status, data);
      return NextResponse.json(
        { success: false, message: 'Lazy mint failed', data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Lazy mint created', data });
  } catch (error) {
    console.error('deploy-drop/lazy-mint error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}


