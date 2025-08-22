import { NextRequest, NextResponse } from 'next/server';

// POST /api/drops/deploy
// Optional body to override defaults; otherwise uses requested parameters from the user
export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.LOOTEX_SECRET_KEY;
    const apiBase = process.env.LOOTEX_API_BASE || 'https://api.lootexplus.com';

    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Server misconfigured: missing LOOTEX_SECRET_KEY' },
        { status: 500 },
      );
    }

    const overrides = await safeJson(request);

    const payload = {
      chainId: 1868,
      mode: 'standard',
      symbol: 'SP',
      totalSupply: 10000,
      unitPrice: 0,
      limitPerWallet: 0,
      creatorFeeBps: 0,
      metadataStorageType: 'metadata-api',
      name: 'SoulPet',
      defaultTokenMetadata: {
        name: 'SoulPet',
      },
      ...overrides,
    } as Record<string, unknown>;

    const res = await fetch(`${apiBase}/v1/project-wallet/drops/deploy`, {
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
      console.error('drops/deploy error:', res.status, data);
      return NextResponse.json(
        { success: false, message: 'Deploy failed', data },
        { status: res.status },
      );
    }

    const usedContractAddress = extractContractAddress(data);
    return NextResponse.json({ success: true, message: 'Deploy success', usedContractAddress, data });
  } catch (error) {
    console.error('drops/deploy fatal:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}

async function safeJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function extractContractAddress(input: unknown): string | null {
  const queue: unknown[] = [input];
  const keyCandidates = new Set([
    'contractAddress',
    'contract_address',
    'address',
    'contract',
  ]);

  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== 'object') continue;
    const obj = node as Record<string, unknown>;

    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        if (keyCandidates.has(k)) {
          if (/^0x[a-fA-F0-9]{40}$/.test(v)) return v;
        }
      }
      if (v && typeof v === 'object') queue.push(v);
    }
  }
  return null;
}


