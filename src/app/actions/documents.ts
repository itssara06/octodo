"use server";

import { v2 as cloudinary } from 'cloudinary';
import { getDb } from '@/db';
import { documents } from '@/db/schema';
import { getSession } from '@/lib/session';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getCloudinarySignature(folder: string = 'octodo_documents') {
  const session = await getSession();
  if (!session.isValid || !session.user) throw new Error("Unauthorized");

  const timestamp = Math.round((new Date()).getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return { timestamp, signature, apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME };
}

export async function createDocumentRecord(data: { name: string; fileUrl: string; thumbnailUrl?: string }) {
  const session = await getSession();
  if (!session.isValid || !session.user) throw new Error("Unauthorized");

  const db = getDb();
  
  // Use crypto.randomUUID() for the ID
  const id = crypto.randomUUID();

  await db.insert(documents).values({
    id,
    userId: session.user.id,
    name: data.name,
    fileUrl: data.fileUrl,
    thumbnailUrl: data.thumbnailUrl,
    fileType: 'pdf',
  });

  revalidatePath('/library');
  return { success: true, id };
}

export async function updateAnnotations(id: string, annotationsData: string) {
  const session = await getSession();
  if (!session.isValid || !session.user) throw new Error("Unauthorized");

  const db = getDb();
  
  // Verify ownership
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc || doc.userId !== session.user.id) throw new Error("Unauthorized");

  await db.update(documents)
    .set({ annotationsData, updatedAt: new Date() })
    .where(eq(documents.id, id));

  return { success: true };
}

export async function getDocuments() {
  const session = await getSession();
  if (!session.isValid || !session.user) throw new Error("Unauthorized");

  const db = getDb();
  const allDocs = await db.select().from(documents).where(eq(documents.userId, session.user.id));
  return allDocs;
}

export async function getDocumentById(id: string) {
  const session = await getSession();
  if (!session.isValid || !session.user) throw new Error("Unauthorized");

  const db = getDb();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  
  if (!doc || doc.userId !== session.user.id) throw new Error("Not found or unauthorized");
  return doc;
}
