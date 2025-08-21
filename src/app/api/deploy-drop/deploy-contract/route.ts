import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// POST /api/deploy-drop/deploy-contract
// Body: { chainId?: number, imageUrl: string, name: string, symbol: string, isCreatorFee?: boolean, creatorFeeAddress?: string }
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
      imageUrl: body.imageUrl,
      name: body.name,
      symbol: body.symbol,
      isCreatorFee: Boolean(body.isCreatorFee ?? false),
      creatorFeeAddress: body.creatorFeeAddress,
    };

    if (!payload.imageUrl || !payload.name || !payload.symbol) {
      return NextResponse.json(
        { success: false, message: 'imageUrl, name, symbol are required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${apiBase}/v1/project-wallet/deploy-drop/deploy-contract`, {
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
      console.error('Lootex deploy-contract error:', res.status, data);
      return NextResponse.json(
        { success: false, message: 'Deploy contract failed', data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Contract deployed', data });
  } catch (error) {
    console.error('deploy-drop/deploy-contract error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}


