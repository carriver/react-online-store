import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';

import type { Product } from '../cart';
import { formatMoney, formatRate, machineCode, machineRows, MACHINE_COLUMNS } from '../catalog';
import CoinIcon from '../components/CoinIcon';
import { coinsPerTap, discoveryBonus } from '../game/economy';
import { centerOf, useGame, useGameSelector } from '../game/GameProvider';
import { currentIncome } from '../game/state';
import './machine.css';

type Phase = 'idle' | 'vending' | 'stuck' | 'dropping';
type Drop = { product: Product; from: DOMRect; to: DOMRect; origin: DOMRect };

const IDLE_MESSAGE = 'SELECT AN ITEM';
const VEND_MS = 900;
const STUCK_CHANCE = 0.15;
const TRAY_SIZE = 6;
const DIGITS = Array.from({ length: MACHINE_COLUMNS }, (_, index) => String(index + 1));

const rollsStuck = () => Math.random() < STUCK_CHANCE;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function Coil({ spinning }: { spinning: boolean }) {
  return (
    <svg className='coil' viewBox='0 0 100 24' preserveAspectRatio='none' aria-hidden='true' focusable='false'>
      <path
        className={spinning ? 'coil__wire coil__wire--spinning' : 'coil__wire'}
        d='M-20 12c5-14 15-14 20 0s15 14 20 0 15-14 20 0 15 14 20 0 15-14 20 0 15 14 20 0 15-14 20 0'
      />
    </svg>
  );
}

function Tray({ items, onOpenCart }: { items: Product[]; onOpenCart: () => void }) {
  return (
    <button type='button' className='machine__tray' onClick={onOpenCart} aria-label={`Pickup tray, ${items.length} items. Open cart`}>
      <span className='machine__flap'>PUSH</span>
      <span className='machine__tray-items' aria-hidden='true'>
        {items.length === 0 ? <span className='machine__tray-empty'>Your snacks land here</span> : null}
        {items.map((item, index) => (
          <img
            key={`${item.id}-${index}`}
            src={item.image}
            alt=''
            width='56'
            height='56'
            style={{ rotate: `${((index * 47) % 30) - 15}deg` }}
          />
        ))}
      </span>
    </button>
  );
}

function MachineMode({ products, onOpenCart }: { products: Product[]; onOpenCart: () => void }) {
  const { dispatch, sfx, pop, getState } = useGame();
  const rate = useGameSelector(currentIncome);
  const discoveredCount = useGameSelector((state) => state.discovered.length);
  const stamps = useGameSelector((state) => state.stamps);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(IDLE_MESSAGE);
  const [phase, setPhase] = useState<Phase>('idle');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [tray, setTray] = useState<Product[]>([]);
  const machine = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const trayRef = useRef<HTMLDivElement>(null);
  const fallRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const vendCount = useRef(0);
  const rows = machineRows(products.length);

  const later = useCallback((callback: () => void, ms: number) => {
    timers.current.push(window.setTimeout(callback, ms));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const indexForCode = (value: string) => {
    const row = rows.indexOf(value[0]);
    const column = Number(value[1]) - 1;
    const index = row * MACHINE_COLUMNS + column;
    return row >= 0 && column >= 0 && index < products.length ? index : null;
  };

  const describe = (index: number) => `${machineCode(index)} · ${formatMoney(products[index].price)} · PRESS VEND`;

  const land = useCallback(
    (product: Product) => {
      const isFirstFind = !getState().discovered.includes(product.id);
      dispatch({ type: 'add', product });
      sfx('thud');
      later(() => sfx(isFirstFind ? 'coin' : 'add'), 120);
      if (trayRef.current)
        pop(isFirstFind ? `First find! +${discoveryBonus(product)}` : 'Clunk!', centerOf(trayRef.current), isFirstFind ? 'coin' : 'info');
      setTray((items) => [...items, product].slice(-TRAY_SIZE));
      setDrop(null);
      setActiveIndex(null);
      setPhase('idle');
      setCode('');
      setMessage(isFirstFind ? 'NEW FIND! ENJOY' : 'ENJOY! COME AGAIN');
      later(() => setMessage((current) => (current.startsWith('NEW') || current.startsWith('ENJOY') ? IDLE_MESSAGE : current)), 2600);
    },
    [dispatch, getState, later, pop, sfx],
  );

  const startDrop = (index: number) => {
    const slotImage = slotRefs.current[index]?.querySelector('img');
    const root = machine.current;
    if (!slotImage || !root || !trayRef.current) {
      land(products[index]);
      return;
    }
    setPhase('dropping');
    setDrop({
      product: products[index],
      from: slotImage.getBoundingClientRect(),
      to: trayRef.current.getBoundingClientRect(),
      origin: root.getBoundingClientRect(),
    });
  };

  useLayoutEffect(() => {
    const element = fallRef.current;
    if (!drop || !element) return;
    if (typeof element.animate !== 'function' || prefersReducedMotion()) {
      land(drop.product);
      return;
    }
    const fallDistance = drop.to.top + drop.to.height / 2 - (drop.from.top + drop.from.height / 2);
    const drift = drop.to.left + drop.to.width / 2 - (drop.from.left + drop.from.width / 2);
    const animation = element.animate(
      [
        {
          transform: 'translate(0, 0) rotate(0deg)',
          easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
        },
        {
          transform: `translate(${drift}px, ${fallDistance}px) rotate(${drift > 0 ? 24 : -24}deg)`,
          offset: 0.72,
          easing: 'ease-out',
        },
        {
          transform: `translate(${drift}px, ${fallDistance - 26}px) rotate(${drift > 0 ? 10 : -10}deg)`,
          offset: 0.86,
          easing: 'ease-in',
        },
        {
          transform: `translate(${drift}px, ${fallDistance}px) rotate(0deg) scale(0.6)`,
          opacity: 0.4,
        },
      ],
      { duration: 820, fill: 'forwards' },
    );
    let cancelled = false;
    animation.finished.then(() => !cancelled && land(drop.product)).catch(() => undefined);
    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [drop, land]);

  const vend = (requested = code) => {
    if (phase === 'stuck') {
      sfx('error');
      setMessage('IT’S STUCK! SHAKE ME');
      return;
    }
    if (phase !== 'idle') return;
    const index = requested.length === 2 ? indexForCode(requested) : null;
    if (index === null) {
      sfx('error');
      setMessage(requested ? 'NO SUCH SLOT' : `PICK A SLOT ${rows[0]}1–${machineCode(products.length - 1)}`);
      return;
    }
    vendCount.current += 1;
    setActiveIndex(index);
    setPhase('vending');
    setMessage(`VENDING ${machineCode(index)}…`);
    sfx('whirr');
    const getsStuck = vendCount.current > 1 && rollsStuck();
    later(() => {
      if (getsStuck) {
        setPhase('stuck');
        sfx('error');
        setMessage('IT’S STUCK! SHAKE ME');
      } else {
        startDrop(index);
      }
    }, VEND_MS);
  };

  const pressLetter = (letter: string) => {
    if (phase !== 'idle') return;
    sfx('key');
    setCode(letter);
    setMessage(`${letter}_`);
  };

  const pressDigit = (digit: string) => {
    if (phase !== 'idle') return;
    sfx('key');
    if (code.length !== 1) {
      setMessage(`PICK A ROW FIRST (${rows.join(' ')})`);
      return;
    }
    const next = code + digit;
    const index = indexForCode(next);
    setCode(next);
    setMessage(index === null ? 'NO SUCH SLOT' : describe(index));
  };

  const clear = () => {
    if (phase !== 'idle') return;
    sfx('key');
    setCode('');
    setMessage(IDLE_MESSAGE);
  };

  const chooseSlot = (index: number) => {
    if (phase !== 'idle') return;
    const slotCode = machineCode(index);
    if (code === slotCode) {
      vend(slotCode);
      return;
    }
    sfx('key');
    setCode(slotCode);
    setMessage(describe(index));
  };

  const shake = (event: MouseEvent<HTMLButtonElement>) => {
    const earned = coinsPerTap(getState().perks.thumb);
    dispatch({ type: 'tap' });
    sfx('thud');
    pop(`+${earned}`, centerOf(event.currentTarget));
    if (machine.current && typeof machine.current.animate === 'function' && !prefersReducedMotion()) {
      machine.current.animate(
        [
          { transform: 'none' },
          { transform: 'rotate(-1.6deg) translateX(-6px)' },
          { transform: 'rotate(1.4deg) translateX(6px)' },
          { transform: 'rotate(-0.8deg)' },
          { transform: 'none' },
        ],
        { duration: 420, easing: 'ease-out' },
      );
    }
    if (phase === 'stuck' && activeIndex !== null) {
      setMessage('THAT DID IT!');
      later(() => startDrop(activeIndex), 260);
    }
  };

  // Typing a code on a real keyboard is half the fun of a vending machine.
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    keyHandler.current = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const key = event.key.toUpperCase();
      if (rows.includes(key)) pressLetter(key);
      else if (DIGITS.includes(key)) pressDigit(key);
      else if (event.key === 'Enter' && code.length === 2 && !(event.target instanceof HTMLButtonElement)) vend();
      else if (event.key === 'Backspace' || event.key === 'Escape') clear();
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const selectedIndex = code.length === 2 ? indexForCode(code) : null;

  return (
    <div className='machine-mode'>
      <div ref={machine} className={`machine machine--${phase}`}>
        <div className='machine__marquee'>
          <span className='machine__bulbs' aria-hidden='true'>
            {Array.from({ length: 12 }, (_, index) => (
              <i key={index} style={{ animationDelay: `${index * 0.12}s` }} />
            ))}
          </span>
          <h2 className='machine__title'>
            Fake-o-Mat <small>3000</small>
          </h2>
        </div>

        <div
          className='machine__glass'
          style={{
            gridTemplateColumns: `repeat(${MACHINE_COLUMNS}, minmax(0, 1fr))`,
          }}>
          {products.map((product, index) => {
            const slotCode = machineCode(index);
            const isActive = activeIndex === index;
            return (
              <button
                key={product.id}
                ref={(element) => {
                  slotRefs.current[index] = element;
                }}
                type='button'
                className={[
                  'slot',
                  selectedIndex === index ? 'slot--selected' : '',
                  isActive && phase === 'vending' ? 'slot--vending' : '',
                  isActive && phase === 'stuck' ? 'slot--stuck' : '',
                  isActive && phase === 'dropping' ? 'slot--empty' : '',
                ].join(' ')}
                onClick={() => chooseSlot(index)}
                aria-label={`${slotCode}: ${product.title}, ${formatMoney(product.price)}`}>
                <span className='slot__product'>
                  <img src={product.image} alt='' width='72' height='72' decoding='async' fetchPriority={index < 10 ? 'high' : 'auto'} />
                </span>
                <Coil spinning={isActive && phase === 'vending'} />
                <span className='slot__tag' aria-hidden='true'>
                  <b>{slotCode}</b> <span className='slot__price'>{formatMoney(product.price)}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className='machine__panel'>
          <p className='machine__lcd' role='status' aria-live='polite'>
            <span>{message}</span>
            <span className='machine__cursor' aria-hidden='true' />
          </p>
          <div className='keypad' role='group' aria-label='Keypad'>
            {rows.map((letter) => (
              <button
                key={letter}
                type='button'
                className='keypad__key keypad__key--letter'
                onClick={() => pressLetter(letter)}
                aria-pressed={code[0] === letter}>
                {letter}
              </button>
            ))}
            {DIGITS.map((digit) => (
              <button key={digit} type='button' className='keypad__key' onClick={() => pressDigit(digit)}>
                {digit}
              </button>
            ))}
            <button type='button' className='keypad__key keypad__key--clear' onClick={clear} aria-label='Clear code'>
              CLR
            </button>
            <button type='button' className='keypad__key keypad__key--vend' onClick={() => vend()}>
              VEND
            </button>
          </div>
          <button type='button' className={`machine__shake${phase === 'stuck' ? ' machine__shake--urgent' : ''}`} onClick={shake}>
            <CoinIcon />
            Shake it
          </button>
          <div className='machine__hopper' aria-label={`Coin hopper filling at ${formatRate(rate)} per second`}>
            <span className='machine__hopper-window' aria-hidden='true'>
              <i />
              <i />
              <i />
            </span>
            <span aria-hidden='true'>
              <b>Hopper</b> {formatRate(rate)}
            </span>
          </div>
          <dl className='machine__stats'>
            <div>
              <dt>Collected</dt>
              <dd>
                {discoveredCount}/{products.length}
              </dd>
            </div>
            <div>
              <dt>Stamps</dt>
              <dd>★ {stamps}</dd>
            </div>
          </dl>
          <div className='machine__plate' aria-hidden='true'>
            <span className='machine__coin-slot' />
            <span className='machine__bill-slot' />
            <p>
              Exact change only*
              <small>*No change. No money. No problem.</small>
            </p>
          </div>
        </div>

        <div className='machine__bottom' ref={trayRef}>
          <Tray items={tray} onOpenCart={onOpenCart} />
        </div>

        {drop ? (
          <div
            ref={fallRef}
            className='vend-fall'
            aria-hidden='true'
            style={{
              left: drop.from.left - drop.origin.left,
              top: drop.from.top - drop.origin.top,
              width: drop.from.width,
              height: drop.from.height,
            }}>
            <img src={drop.product.image} alt='' />
          </div>
        ) : null}
      </div>

      <p className='machine-mode__hint'>
        Type a code like <kbd>B3</kbd> on the keypad (or your keyboard) and press <kbd>VEND</kbd>. Tap a slot twice to vend it.
      </p>
    </div>
  );
}

export default MachineMode;
