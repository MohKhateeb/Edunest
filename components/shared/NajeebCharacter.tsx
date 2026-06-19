'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface NajeebCharacterProps {
  mode: 'welcome' | 'study' | 'success' | 'help';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

const characterImages = {
  welcome: '/characters/najeeb_welcome.png?v=2',
  study: '/characters/najeeb_study.png?v=2',
  success: '/characters/najeeb_success.png?v=2',
  help: '/characters/najeeb_help.png?v=2',
};

const sizeClasses = {
  xs: 'w-12 h-12',
  sm: 'w-24 h-24',
  md: 'w-40 h-40 md:w-48 md:h-48',
  lg: 'w-64 h-64 md:w-72 md:h-72',
  xl: 'w-80 h-80 md:w-[350px] md:h-[350px]',
};

const sizeDimensions = {
  xs: 48,
  sm: 96,
  md: 192,
  lg: 288,
  xl: 350,
};

export default function NajeebCharacter({
  mode,
  size = 'md',
  animated = false,
  className,
}: NajeebCharacterProps) {
  const imageSrc = characterImages[mode] || characterImages.welcome;
  const dimension = sizeDimensions[size];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center pointer-events-none select-none',
        sizeClasses[size],
        animated && 'animate-float',
        className
      )}
    >
      <Image
        src={imageSrc}
        alt={`نصيحة من نجيب - وضع ${mode}`}
        width={dimension}
        height={dimension}
        className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
        priority={mode === 'welcome'}
        unoptimized
      />
    </div>
  );
}
