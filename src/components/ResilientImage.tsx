import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackLabel?: string;
  fallbackClassName?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  fallbackLabel,
  fallbackClassName = '',
  className = '',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1F3A] via-[#13315C] to-sky-800 text-white p-4 text-center ${fallbackClassName} ${className}`}
      >
        <ImageOff className="h-5 w-5 text-sky-300 opacity-80 mb-1.5" />
        <span className="text-[11px] font-semibold tracking-wide text-sky-100 line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      {...rest}
    />
  );
};
