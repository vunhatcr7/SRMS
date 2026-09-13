interface AvatarProps {
  initials?: string;
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

export default function Avatar({ initials, name, src, size = 'md', className = '' }: AvatarProps) {
  const display = initials || name?.slice(0, 2).toUpperCase() || '?';
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ${sizeStyles[size]} ${className}`}
      />
    );
  }
  return (
    <div className={`grid place-items-center rounded-full bg-brand/10 text-brand font-semibold ${sizeStyles[size]} ${className}`}>
      {display}
    </div>
  );
}
