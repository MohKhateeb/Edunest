'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { Notification } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getUserNotifications(): Promise<ActionResponse<Notification[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'غير مصرح لك' };
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20, // Fetch the latest 20 notifications
    });

    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب الإشعارات' };
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'غير مصرح لك' };
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return { success: false, error: 'الإشعار غير موجود' };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'حدث خطأ' };
  }
}

export async function markAllNotificationsAsRead(): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'غير مصرح لك' };
    }

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'حدث خطأ' };
  }
}
