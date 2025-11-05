import { Request, Response, NextFunction } from 'express';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

/**
 * Servicio para subir imágenes a Cloudinary
 */
export class ImageService {
  /**
   * Sube una imagen a Cloudinary
   * @param file - Archivo de multer
   * @param folder - Carpeta en Cloudinary (products, categories, suppliers, etc.)
   * @returns URL de la imagen subida
   */
  static async uploadImage(file: any, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `bellezapp/${folder}`,
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Redimensionar máximo 800x800
            { quality: 'auto' }, // Calidad automática
            { fetch_format: 'auto' } // Formato automático (WebP en navegadores compatibles)
          ]
        },
        (error: any, result: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      // Convertir el buffer a stream
      const bufferStream = Readable.from(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param imageUrl - URL de la imagen a eliminar
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extraer el public_id de la URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('.')[0];
      const folder = urlParts[urlParts.length - 2];
      const publicId = `bellezapp/${folder}/${fileName}`;

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }
}

/**
 * Middleware para procesar el upload de imagen
 */
export const processImageUpload = (folderName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`🖼️ Procesando imagen para carpeta: ${folderName}`);
      console.log('📁 Archivo recibido:', (req as any).file ? 'Sí' : 'No');
      
      if ((req as any).file) {
        console.log('📊 Detalles del archivo:', {
          originalname: (req as any).file.originalname,
          mimetype: (req as any).file.mimetype,
          size: (req as any).file.size
        });
        
        const imageUrl = await ImageService.uploadImage((req as any).file, folderName);
        req.body.foto = imageUrl; // Agregar la URL al body
        console.log('✅ Imagen subida exitosamente:', imageUrl);
      }
      next();
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error uploading image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};
