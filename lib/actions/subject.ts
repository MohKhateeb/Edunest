'use server';

import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';

export async function getActiveSubjects(): Promise<ActionResponse<{ id: string, name: string }[]>> {
  try {
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: subjects };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to fetch subjects' };
  }
}
