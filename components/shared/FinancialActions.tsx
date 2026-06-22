'use client';

import { useState } from 'react';
import { PaymentModal } from './PaymentModal';
import { DisputeModal } from './DisputeModal';

export function PaymentAction({ bookingId, price }: { bookingId: string; price: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        دفع الآن
      </button>
      {isOpen && <PaymentModal bookingId={bookingId} price={price} onClose={() => setIsOpen(false)} />}
    </>
  );
}

export function DisputeAction({ bookingId }: { bookingId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors border border-red-200 dark:border-red-900/50"
      >
        تقديم اعتراض
      </button>
      {isOpen && <DisputeModal bookingId={bookingId} onClose={() => setIsOpen(false)} />}
    </>
  );
}
