interface Props {
  label: string;
  src?: string | null;
  className?: string;
  alt?: string;
}

export function PhotoSlot({ label, src, className = "", alt = "" }: Props) {
  if (src) {
    return (
      <div
        className={`photo-slot has-image ${className}`}
        data-label={label}
      >
        <img src={src} alt={alt} loading="lazy" />
      </div>
    );
  }
  return <div className={`photo-slot ${className}`} data-label={label} />;
}
