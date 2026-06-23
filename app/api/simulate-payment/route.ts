import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 400 });
    }

    // Generate a Jitsi meeting URL
    const meetingUrl = `https://meet.jit.si/EduNest-${crypto.randomBytes(8).toString('hex')}`;

    // Update booking to PAID and add meeting URL
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        meetingUrl: meetingUrl,
      }
    });

    // Update the payment record
    await prisma.payment.update({
      where: { bookingId },
      data: {
        isPaid: true,
        paidAt: new Date()
      }
    });

    return NextResponse.json({ success: true, meetingUrl });
  } catch (error) {
    console.error('Payment simulation error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
