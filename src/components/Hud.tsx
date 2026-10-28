import { Link } from 'react-router';

import { countItems } from '../cart';
import { formatCoins, formatRate } from '../catalog';
import { useGame, useGameSelector } from '../game/GameProvider';
import { currentIncome, type Mode } from '../game/state';
import CoinIcon from './CoinIcon';
import './Hud.css';

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'room', label: 'Cozy Room' },
  { mode: 'machine', label: 'Fake-o-Mat' },
];

function CoinCounter() {
  const coins = useGameSelector((state) => Math.floor(state.coins));
  const rate = useGameSelector(currentIncome);
  return (
    <div className='coin-counter' aria-label={`${formatCoins(coins)} coins, earning ${formatRate(rate)} per second`}>
      <CoinIcon />
      <span className='coin-counter__value' aria-hidden='true'>
        {formatCoins(coins)}
      </span>
      <span className='coin-counter__rate' aria-hidden='true'>
        {formatRate(rate)}
      </span>
    </div>
  );
}

function ModeToggle() {
  const mode = useGameSelector((state) => state.mode);
  const { dispatch, sfx } = useGame();
  return (
    <div className='mode-toggle' role='group' aria-label='Store mode' data-mode={mode}>
      <span className='mode-toggle__pill' aria-hidden='true' />
      {MODES.map((option) => (
        <button
          key={option.mode}
          type='button'
          className='mode-toggle__option'
          aria-pressed={mode === option.mode}
          onClick={() => {
            if (mode === option.mode) return;
            sfx('tap');
            dispatch({ type: 'setMode', mode: option.mode });
          }}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SoundToggle() {
  const muted = useGameSelector((state) => state.muted);
  const { dispatch } = useGame();
  return (
    <button
      type='button'
      className='hud__icon-button'
      aria-pressed={!muted}
      aria-label='Sound effects'
      onClick={() => dispatch({ type: 'toggleMute' })}>
      <svg viewBox='0 0 24 24' aria-hidden='true'>
        <path d='M4 9h4l5-4v14l-5-4H4z' fill='currentColor' />
        {muted ? (
          <path d='M16 9l5 6M21 9l-5 6' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' />
        ) : (
          <path d='M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' />
        )}
      </svg>
    </button>
  );
}

function Hud({ onOpenCart, onOpenPerks }: { onOpenCart: () => void; onOpenPerks: () => void }) {
  const itemCount = useGameSelector((state) => countItems(state.cart));
  return (
    <header className='hud'>
      <Link to='/' className='hud__brand' aria-label='Fake Store home'>
        <span className='hud__logo' aria-hidden='true'>
          FS
        </span>
        <span className='hud__name'>Fake Store</span>
      </Link>
      <CoinCounter />
      <ModeToggle />
      <SoundToggle />
      <div className='hud__actions'>
        <button type='button' className='chunky chunky--butter hud__perks' onClick={onOpenPerks}>
          <svg viewBox='0 0 24 24' aria-hidden='true' className='hud__perks-icon'>
            <path d='M12 2l2.6 6.4L21 9l-5 4.4L17.5 20 12 16.6 6.5 20 8 13.4 3 9l6.4-.6z' fill='currentColor' />
          </svg>
          Perks
        </button>
        <button type='button' className='chunky chunky--primary hud__cart' onClick={onOpenCart} aria-label={`Cart, ${itemCount} items`}>
          <svg viewBox='0 0 24 24' aria-hidden='true'>
            <path d='M3 4h2.5l2.2 10.5h10.6L20.5 7H7' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinejoin='round' strokeLinecap='round' />
            <circle cx='9.5' cy='19' r='1.7' fill='currentColor' />
            <circle cx='16.5' cy='19' r='1.7' fill='currentColor' />
          </svg>
          <span key={itemCount} className='hud__badge' aria-hidden='true'>
            {itemCount}
          </span>
        </button>
      </div>
    </header>
  );
}

export default Hud;
