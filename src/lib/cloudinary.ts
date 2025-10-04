import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Función auxiliar para subir imágenes desde base64
export async function uploadImage(
  base64Image: string,
  folder: string = "tiendeo/products"
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Error al subir la imagen");
  }
}

// Función auxiliar para eliminar imágenes
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    if (!imageUrl || imageUrl.trim() === "") {
      return;
    }

    // Extraer public_id de la URL de Cloudinary
    // URL ejemplo: https://res.cloudinary.com/cloud_name/image/upload/v123456/tiendeo/products/abc123.jpg
    const urlParts = imageUrl.split("/upload/");
    if (urlParts.length < 2) {
      console.error("Invalid Cloudinary URL format:", imageUrl);
      return;
    }

    // Obtener la parte después de /upload/ y remover la versión (v123456/)
    let pathWithFile = urlParts[1];
    const versionMatch = pathWithFile.match(/^v\d+\//);
    if (versionMatch) {
      pathWithFile = pathWithFile.substring(versionMatch[0].length);
    }

    // Remover la extensión del archivo
    const publicId = pathWithFile.substring(0, pathWithFile.lastIndexOf("."));

    console.log("Deleting from Cloudinary, public_id:", publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary deletion result:", result);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    // No lanzamos error para no bloquear otras operaciones
  }
}
