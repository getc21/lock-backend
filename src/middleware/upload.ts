import multer from 'multer';
import { Request } from 'express';

// Configuración de multer para recibir archivos en memoria
const storage = multer.memoryStorage();

// Filtro para solo permitir imágenes
const fileFilter = (req: Request, file: any, cb: any) => {
  console.log('🔍 File filter - Checking file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // Verificar por mimetype o por extensión de archivo
  const isImageByMime = file.mimetype && file.mimetype.startsWith('image/');
  const isImageByExtension = file.originalname && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.originalname);
  
  if (isImageByMime || isImageByExtension) {
    cb(null, true);
  } else {
    cb(new Error(`Solo se permiten archivos de imagen. Tipo recibido: ${file.mimetype || 'undefined'}`));
  }
};

// Middleware de upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});
