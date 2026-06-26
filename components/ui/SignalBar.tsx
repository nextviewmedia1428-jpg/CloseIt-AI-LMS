export function SignalBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-full ${className}`}
      style={{ background: 'linear-gradient(90deg, #FF5A36 0%, #FFB627 50%, #3E7CB1 100%)' }}
    />
  );
}
