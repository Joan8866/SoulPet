import { NextRequest, NextResponse } from 'next/server';

// POST /api/deploy-drop/set-conditions
// Body: { chainId?: number, contractId: string, price: string, amount: number, startTime?: string, endTime?: string, limitPerWallet?: number, currencyAddress?: string }
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
      price: String(body.price),
      currencyAddress: body.currencyAddress,
      amount: Number(body.amount || 0),
      startTime: body.startTime,
      endTime: body.endTime,
      limitPerWallet: body.limitPerWallet != null ? Number(body.limitPerWallet) : undefined,
    };

    if (!payload.contractId || payload.price == null || payload.amount == null) {
      return NextResponse.json(
        { success: false, message: 'contractId, price, amount are required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${apiBase}/v1/project-wallet/deploy-drop/set-conditions`, {
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
      console.error('Lootex set-conditions error:', res.status, data);
      return NextResponse.json(
        { success: false, message: 'Set conditions failed', data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Conditions updated', data });
  } catch (error) {
    console.error('deploy-drop/set-conditions error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}




