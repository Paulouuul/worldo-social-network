import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_PUBLIC_BUCKET, R2_PRIVATE_BUCKET, R2_PUBLIC_URL } from './r2';

/**
 * Upload de arquivo para bucket público
 * @param file - Arquivo a ser enviado
 * @param path - Caminho no bucket (ex: avatars/userId/current.jpg)
 * @returns URL pública do arquivo
 */
export async function uploadPublic(file: File, path: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: R2_PUBLIC_BUCKET,
    Key: path,
    Body: buffer,
    ContentType: file.type,
  });

  await r2Client.send(command);

  return `${R2_PUBLIC_URL}/${path}`;
}

/**
 * Upload de arquivo para bucket privado
 * @param file - Arquivo a ser enviado
 * @param path - Caminho no bucket (ex: chat_messages/chatId/messageId/file.jpg)
 * @returns Path do arquivo (para gerar URL assinada depois)
 */
export async function uploadPrivate(file: File, path: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: R2_PRIVATE_BUCKET,
    Key: path,
    Body: buffer,
    ContentType: file.type,
  });

  await r2Client.send(command);

  return path;
}

/**
 * Gerar URL assinada para arquivo privado
 * @param path - Caminho do arquivo no bucket privado
 * @param expiresIn - Tempo de expiração em segundos (padrão: 3600 = 1 hora)
 * @returns URL assinada temporária
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_PRIVATE_BUCKET,
    Key: path,
  });

  return await getS3SignedUrl(r2Client, command, { expiresIn });
}

/**
 * Deletar arquivo de qualquer bucket
 * @param path - Caminho do arquivo
 * @param isPublic - Se é público (true) ou privado (false)
 */
export async function deleteFile(path: string, isPublic: boolean = true): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: isPublic ? R2_PUBLIC_BUCKET : R2_PRIVATE_BUCKET,
    Key: path,
  });

  await r2Client.send(command);
}

/**
 * Verificar se arquivo existe
 * @param path - Caminho do arquivo
 * @param isPublic - Se é público (true) ou privado (false)
 * @returns boolean
 */
export async function fileExists(path: string, isPublic: boolean = true): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: isPublic ? R2_PUBLIC_BUCKET : R2_PRIVATE_BUCKET,
      Key: path,
    });
    await r2Client.send(command);
    return true;
  } catch {
    return false;
  }
}
