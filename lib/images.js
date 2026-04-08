/**
 * 图片存储
 */
import { dbGet, dbPut, dbDelete } from './idb.js';
import { generateId } from './utils.js';

const STORE_NAME = 'images';

/**
 * 保存图片
 * @param {string} base64Data - Base64编码的图片数据
 * @param {string} mimeType - MIME类型
 * @returns {Promise<string>} 图片ID
 */
export async function saveImage(base64Data, mimeType = 'image/png') {
  const id = generateId();
  const image = {
    id,
    data: base64Data,
    mimeType,
    createdAt: Date.now()
  };
  await dbPut(STORE_NAME, image);
  return id;
}

/**
 * 获取图片
 */
export async function getImage(id) {
  return dbGet(STORE_NAME, id);
}

/**
 * 删除图片
 */
export async function deleteImage(id) {
  await dbDelete(STORE_NAME, id);
}

/**
 * 将图片URL转换为本地存储
 * @param {string} url - 图片URL
 * @returns {Promise<string>} 图片ID
 */
export async function saveImageFromUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const id = await saveImage(reader.result, blob.type);
        resolve(id);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to save image from URL:', error);
    throw error;
  }
}
