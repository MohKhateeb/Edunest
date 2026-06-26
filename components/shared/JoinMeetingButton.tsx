'use client';

import { useRouter } from 'next/navigation';
import { Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JoinMeetingButtonProps {
  bookingId: string;
  variant?: 'icon' | 'small' | 'large' | 'giant';
  className?: string;
  label?: string;
}

export default function JoinMeetingButton({ 
  bookingId, 
  variant = 'small', 
  className,
  label = 'انضم للغرفة'
}: JoinMeetingButtonProps) {
  const router = useRouter();

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/session/${bookingId}/meet`);
  };

  if (variant === 'giant') {
    return (
      <button
        onClick={handleJoin}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer",
          className
        )}
      >
        <Video className="w-6 h-6" />
        {label}
      </button>
    );
  }

  if (variant === 'large') {
    return (
      <button
        onClick={handleJoin}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 py-2.5 rounded-xl shadow-sm transition-transform hover:scale-105 animate-pulse",
          className
        )}
      >
        <Video className="h-4 w-4" />
        {label}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleJoin}
        className={cn(
          "p-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer transition-colors shadow-xs animate-bounce",
          className
        )}
        title={label}
      >
        <Video className="h-2.5 w-2.5" />
      </button>
    );
  }

  // default small variant
  return (
    <button
      onClick={handleJoin}
      className={cn(
        "px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer animate-pulse shadow-xs",
        className
      )}
    >
      <Video className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );
}
