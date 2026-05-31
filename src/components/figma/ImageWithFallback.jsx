export function ImageWithFallback({ src, alt, className, style }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
}
