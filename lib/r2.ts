import { S3Client } from '@aws-sdk/client-s3'

// Configuração do cliente Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Necessário para R2
})

// Buckets
export const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET!
export const R2_PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET!
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

// Validação das variáveis de ambiente
if (!R2_PUBLIC_BUCKET || !R2_PRIVATE_BUCKET || !R2_PUBLIC_URL) {
  throw new Error('Missing R2 environment variables')
}