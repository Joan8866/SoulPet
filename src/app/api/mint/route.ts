import { NextRequest, NextResponse } from 'next/server';

interface MintRequest {
  walletAddress: string;
  metadataUri: string; // 目前 Lootex Server Wallet Mint 不需此欄，保留以符合前端流程
  userName: string;
  animalType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, metadataUri, userName, animalType }: MintRequest = await request.json();

    const secretKey = process.env.LOOTEX_SECRET_KEY;
    const apiBase = process.env.LOOTEX_API_BASE || 'https://local-api.lootex.dev';
    const contractAddress = process.env.LOOTEX_CONTRACT_ADDRESS; // 需預先部署或提供
    const chainId = Number(process.env.LOOTEX_CHAIN_ID || 1868);
    const contractId = process.env.LOOTEX_CONTRACT_ID; // 若存在，將使用 lazy-mint 產生帶有此用戶資訊的資產

    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Server misconfigured: missing LOOTEX_SECRET_KEY' },
        { status: 500 }
      );
    }

    if (!contractAddress) {
      return NextResponse.json(
        { success: false, message: 'Server misconfigured: missing LOOTEX_CONTRACT_ADDRESS' },
        { status: 500 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'walletAddress is required' },
        { status: 400 }
      );
    }

    console.log('Mint request (normalized):', {
      walletAddress,
      metadataUri, // 先保留紀錄，Lootex 目前的直鑄 API 不使用此欄
      userName,
      animalType,
      chainId,
      contractAddress,
      contractId,
    });

    // 若有 contractId，先為該使用者結果建立一筆 lazy-mint 資產（使用結果圖片 + 組合描述）
    if (contractId) {
      const host = request.headers.get('host') || 'localhost:3000';
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const publicBaseUrl = `${proto}://${host}`;
      const today = new Date().toISOString().split('T')[0];
      const assetName = `${userName}'s Soulpet: ${animalType}`;
      const assetDescription = `Soulpet result for ${userName} on ${today}.`;
      const assetImageUrl = `${publicBaseUrl}/assets/animals/${animalType}.png`;

      const lazyMintRes = await fetch(`${apiBase}/v1/project-wallet/deploy-drop/lazy-mint`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId,
          contractId,
          assetName,
          assetDescription,
          assetImageUrl,
          amount: 1,
        }),
        // @ts-expect-error next
        cache: 'no-store',
      });
      const lazyMintData = await lazyMintRes.json().catch(() => ({}));
      if (!lazyMintRes.ok) {
        console.error('Lootex lazy-mint API error:', lazyMintRes.status, lazyMintData);
        return NextResponse.json(
          { success: false, message: 'Lootex lazy-mint API failed', data: lazyMintData },
          { status: lazyMintRes.status }
        );
      }
      console.log('Lazy-mint created:', lazyMintData);
    }

    // 依據官方文件使用 Server Wallet Mint 將 1 枚 NFT 鑄給使用者地址
    // Ref: https://docs.lootexplus.com/server-wallet/mint
    const res = await fetch(`${apiBase}/v1/project-wallet/mint`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chainId,
        contractAddress,
        recipientAddress: walletAddress,
        quantity: 1,
      }),
      // Next.js Route Handler fetch init options
      // @ts-expect-error next
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Lootex mint API error:', res.status, data);
      return NextResponse.json(
        {
          success: false,
          message: 'Lootex mint API failed',
          data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'NFT minted successfully',
      data,
    });
  } catch (error) {
    console.error('Error minting NFT:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mint NFT',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
