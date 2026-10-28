function CoinIcon({ className = 'coin-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
      <circle cx='12' cy='12' r='10' fill='#ffc93c' stroke='#2a1a12' strokeWidth='2.2' />
      <circle cx='12' cy='12' r='6.2' fill='none' stroke='#d99a12' strokeWidth='1.6' />
      <path d='M12 7.4l1.3 3.3 3.3 1.3-3.3 1.3L12 16.6l-1.3-3.3L7.4 12l3.3-1.3z' fill='#2a1a12' />
    </svg>
  );
}

export default CoinIcon;
