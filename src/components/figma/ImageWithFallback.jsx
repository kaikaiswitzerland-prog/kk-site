export function ImageWithFallback({ src, alt, className, style, loading, fetchPriority }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      fetchpriority={fetchPriority}
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
}
