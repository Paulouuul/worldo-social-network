// lib/r2-upload.ts
// Operações de arquivo no Cloudflare R2 (API S3) a partir do Next.js: upload público/privado, URL
// assinada, remoção e verificação de existência.

import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_PUBLIC_BUCKET, R2_PRIVATE_BUCKET, R2_PUBLIC_URL } from './r2';

/**
 * Envia o arquivo ao bucket público e retorna a URL pública (`path` ex.:
 * avatars/<userId>/current.jpg).
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

/** Envia o arquivo ao bucket privado e retorna a chave (`path`) para gerar URL assinada depois. */
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

/** Gera URL temporária de leitura de um arquivo privado (padrão: 1 hora). */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_PRIVATE_BUCKET,
    Key: path,
  });

  return await getS3SignedUrl(r2Client, command, { expiresIn });
}

/** Remove o arquivo do bucket público ou privado. */
export async function deleteFile(path: string, isPublic: boolean = true): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: isPublic ? R2_PUBLIC_BUCKET : R2_PRIVATE_BUCKET,
    Key: path,
  });

  await r2Client.send(command);
}

/** Indica se o arquivo existe no bucket público ou privado. */
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
