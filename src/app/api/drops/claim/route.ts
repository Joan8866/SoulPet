import { NextRequest, NextResponse } from 'next/server';

interface ClaimBody {
  recipientAddress: string;
  contractAddress?: string; // if omitted, use env
  userName?: string;
  animalType?: string;
  imageUrl?: string; // 新增：Cloudinary 圖片 URL
}

// POST /api/drops/claim
export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.LOOTEX_SECRET_KEY;
    const apiBase = process.env.LOOTEX_API_BASE || 'https://api.lootexplus.com';
    const envContract = process.env.LOOTEX_CONTRACT_ADDRESS;

    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Server misconfigured: missing LOOTEX_SECRET_KEY' },
        { status: 500 },
      );
    }

    const body = (await request.json()) as ClaimBody;
    const contractAddress = body.contractAddress || envContract;
    if (!contractAddress) {
      return NextResponse.json(
        { success: false, message: 'Missing contractAddress (env or body)' },
        { status: 400 },
      );
    }

    if (!body.recipientAddress) {
      return NextResponse.json(
        { success: false, message: 'recipientAddress is required' },
        { status: 400 },
      );
    }

    // Build override metadata
    const today = new Date().toISOString().split('T')[0];
    
    // 優先使用傳入的 Cloudinary 圖片 URL，否則使用靜態動物圖片
    let imageUrl: string;
    
    if (body.imageUrl) {
      imageUrl = body.imageUrl;
    } else {
      // Fallback 到靜態動物圖（使用當前域名）
      const origin = request.headers.get('origin') || request.headers.get('host') || '';
      const baseUrl = origin.startsWith('http') ? origin : (origin ? `http://${origin}` : '');
      const animalFile = `${encodeURIComponent(body.animalType || 'Cat')}.png`;
      imageUrl = `${baseUrl}/assets/animals/${animalFile}`;
    }
    
    const payload = {
      chainId: 1868,
      quantity: 1,
      contractAddress,
      recipientAddress: body.recipientAddress,
      overrideMetadata: [
        {
          name: 'SoulPet',
          description: `${body.userName || 'User'}'s SoulPet: ${body.animalType || ''}`.trim(),
          image: imageUrl,
          externalUrl: 'https://www.lootexplus.com/',
          attributes: [
            { trait_type: 'Animal', value: body.animalType || '' },
            { trait_type: 'Owner', value: body.userName || 'Unknown' },
            { trait_type: 'Date', value: today },
          ],
        },
      ],
    };

    const res = await fetch(`${apiBase}/v1/project-wallet/drops/claim`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store' as RequestCache,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('drops/claim error:', res.status, data);
      return NextResponse.json(
        { success: false, message: 'Claim failed', data },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true, message: 'Claim success', usedContractAddress: contractAddress, data });
  } catch (error) {
    console.error('drops/claim fatal:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}


