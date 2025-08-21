import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// POST /api/deploy-drop/upload-image
// Body: { animal: string, assetName?: string, filePathOverride?: string }
// Reads image from public/assets/animals/{animal}.png (or filePathOverride),
// uploads to Lootex deploy-drop upload-image endpoint, returns imageUrl.
export async function POST(request: NextRequest) {
  try {
    const { animal, assetName, filePathOverride } = await request.json();

    if (!animal && !filePathOverride) {
      return NextResponse.json(
        { success: false, message: 'animal or filePathOverride is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.LOOTEX_SECRET_KEY;
    const apiBase = process.env.LOOTEX_API_BASE || 'https://local-api.lootex.dev';

    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: 'Server misconfigured: missing LOOTEX_SECRET_KEY' },
        { status: 500 }
      );
    }

    const projectRoot = process.cwd();
    const resolvedPath = filePathOverride
      ? path.isAbsolute(filePathOverride)
        ? filePathOverride
        : path.join(projectRoot, filePathOverride)
      : path.join(projectRoot, 'public', 'assets', 'animals', `${animal}.png`);

    const fileBuffer = await fs.readFile(resolvedPath);
    const file = new Blob([fileBuffer], { type: 'image/png' });

    const form = new FormData();
    form.append('imageFile', file, `${animal || 'asset'}.png`);
    form.append('assetName', assetName || `Soulpet ${animal || 'Asset'}`);

    const res = await fetch(`${apiBase}/v1/project-wallet/deploy-drop/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      body: form as any,
      // @ts-expect-error next
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Lootex upload-image error:', res.status, data);
      return NextResponse.json(
        { success: false, message: 'Upload image failed', data },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Image uploaded', data });
  } catch (error) {
    console.error('deploy-drop/upload-image error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}


