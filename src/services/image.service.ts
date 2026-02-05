import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Servicio para guardar imágenes localmente
 */
export class ImageService {
  private static uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Asegura que el directorio de uploads existe
   */
  static ensureUploadDirExists(folder: string): void {
    const folderPath = path.join(this.uploadsDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  /**
   * Guarda una imagen localmente
   * @param file - Archivo de multer
   * @param folder - Carpeta de destino (products, categories, suppliers, etc.)
   * @returns URL de la imagen guardada
   */
  static async uploadImage(file: any, folder: string): Promise<string> {
    try {
      // Crear directorio si no existe
      this.ensureUploadDirExists(folder);

      // Generar nombre único con timestamp
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const filename = `${timestamp}${extension}`;

      // Ruta completa del archivo
      const folderPath = path.join(this.uploadsDir, folder);
      const filePath = path.join(folderPath, filename);

      // Guardar archivo
      await fs.promises.writeFile(filePath, file.buffer);

      // Retornar URL relativa
      const apiUrl = process.env.API_URL || 'http://localhost:3000';
      return `${apiUrl}/uploads/${folder}/${filename}`;
    } catch (error) {
      console.error('❌ Error guardando imagen:', error);
      throw error;
    }
  }

  /**
   * Elimina una imagen del servidor
   * @param imageUrl - URL de la imagen a eliminar
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extraer nombre del archivo de la URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];

      const filePath = path.join(this.uploadsDir, folder, filename);

      // Verificar que el archivo existe antes de eliminarlo
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`✅ Imagen eliminada: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
    }
  }
}

/**
 * Middleware para procesar el upload de imagen
 */
export const processImageUpload = (folderName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      if ((req as any).file) {
        console.log('📊 Detalles del archivo:', {
          originalname: (req as any).file.originalname,
          mimetype: (req as any).file.mimetype,
          size: (req as any).file.size
        });
        
        const imageUrl = await ImageService.uploadImage((req as any).file, folderName);
        req.body.foto = imageUrl; // Agregar la URL al body
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
