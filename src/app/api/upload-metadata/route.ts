import { NextRequest, NextResponse } from 'next/server';

interface Metadata {
  name: string;
  description: string;
  image: string; // 完整的公開圖片 URL
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

// 現行 Lootex Server Wallet 直鑄 API 不要求先上傳 metadata URI。
// 為了維持前端流程，本端點目前回傳可用作顯示用途的 metadata 概覽，
// 並以 image URL 暫做為 metadataUri（後續若需改為 IPFS/後端儲存，可在此擴充）。
export async function POST(request: NextRequest) {
  try {
    const metadata: Metadata = await request.json();

    if (!metadata?.name || !metadata?.image) {
      return NextResponse.json(
        { success: false, message: 'name and image are required in metadata' },
        { status: 400 }
      );
    }

    // 目前僅回傳 image 當作暫時的 metadataUri。
    // 若日後需整合 IPFS 或 Lootex 的上傳服務，可在此擴充並回傳實際的 URI。
    const response = {
      success: true,
      message: 'Metadata accepted',
      data: {
        uri: metadata.image,
        preview: metadata,
      },
    };

    console.log('Upload-metadata accepted:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error uploading metadata:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process metadata',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
