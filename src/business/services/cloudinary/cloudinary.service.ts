import { v2 as cloudinary } from 'cloudinary';
import { environmentVariables } from '@/config';
import { BadRequestError } from '@/business';

// Отладка переменных окружения
console.log('Cloudinary config check:', {
  cloud_name: environmentVariables.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
  api_key: environmentVariables.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  api_secret: environmentVariables.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
});

cloudinary.config({
  cloud_name: environmentVariables.CLOUDINARY_CLOUD_NAME,
  api_key: environmentVariables.CLOUDINARY_API_KEY,
  api_secret: environmentVariables.CLOUDINARY_API_SECRET,
});

interface UploadOptions {
  folder?: string;
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
}

const uploadAvatar = async (
  buffer: Buffer,
  userId: string,
  options: UploadOptions = {},
): Promise<{ url: string; publicId: string }> => {
  try {
    const defaultOptions: UploadOptions = {
      folder: 'spendly/avatars',
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto',
      ...options,
    };

    const publicId = `${defaultOptions.folder}/${userId}`;

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            overwrite: true,
            transformation: {
              width: defaultOptions.width,
              height: defaultOptions.height,
              crop: defaultOptions.crop,
              quality: defaultOptions.quality,
            },
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });

    const uploadResult = result as any;

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new BadRequestError('Failed to upload avatar');
  }
};

const deleteAvatar = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

const getAvatarUrl = (
  publicId: string,
  options: UploadOptions = {},
): string => {
  return cloudinary.url(publicId, {
    width: options.width || 300,
    height: options.height || 300,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto',
    fetch_format: 'auto',
  });
};

export const cloudinaryService = {
  uploadAvatar,
  deleteAvatar,
  getAvatarUrl,
};
