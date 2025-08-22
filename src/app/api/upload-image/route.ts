import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json(
        { success: false, message: 'Missing image data' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload(
        imageBase64,
        {
          folder: 'soulpet',
          public_id: `soulpet_${Date.now()}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result as { secure_url: string; public_id: string });
          else reject(new Error('Upload failed'));
        }
      );
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Image upload failed' },
      { status: 500 }
    );
  }
}
