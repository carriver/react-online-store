import { useEffect } from 'react';

import { formatMoney } from '../catalog';
import { COUPONS, STAMP_BONUS } from '../game/economy';
import { useGame, useGameSelector } from '../game/GameProvider';
import Sheet from './Sheet';
import './ReceiptSheet.css';

const PRINT_MS = 1400;
const PRINT_TICK_MS = 110;

// Deterministic bar widths, so the same receipt number always prints the same barcode.
const barcodeBars = (seed: number) =>
  Array.from({ length: 34 }, (_, index) => 1 + (((seed + 3) * (index + 7) * 2654435761) >>> 0) % 4);

function Barcode({ seed }: { seed: number }) {
  const bars = barcodeBars(seed).reduce<{ x: number; width: number }[]>(
    (placed, width) => [...placed, { x: placed.length ? placed[placed.length - 1].x + placed[placed.length - 1].width * 2 : 0, width }],
    [],
  );
  const last = bars[bars.length - 1];
  return (
    <svg className='receipt__barcode' viewBox={`0 0 ${last.x + last.width * 2} 40`} preserveAspectRatio='none' aria-hidden='true'>
      {bars.map((bar, index) => (
        <rect key={index} x={bar.x} width={bar.width} height='40' />
      ))}
    </svg>
  );
}

function ReceiptSheet() {
  const receipt = useGameSelector((state) => state.lastReceipt);
  const totalStamps = useGameSelector((state) => state.stamps);
  const { dispatch, sfx } = useGame();

  useEffect(() => {
    if (!receipt) return;
    const printer = window.setInterval(() => sfx('print'), PRINT_TICK_MS);
    const stop = window.setTimeout(() => window.clearInterval(printer), PRINT_MS);
    return () => {
      window.clearInterval(printer);
      window.clearTimeout(stop);
    };
  }, [receipt, sfx]);

  const close = () => dispatch({ type: 'dismissReceipt' });

  return (
    <Sheet open={receipt !== null} onClose={close} title='Order printed' placement='center' closeLabel='Close receipt'>
      {receipt ? (
        <>
          <div className='receipt-slot' aria-hidden='true' />
          <article className='receipt' aria-label={`Receipt number ${receipt.number}`}>
            <header className='receipt__head'>
              <p className='receipt__store'>FAKE STORE</p>
              <p>Est. whenever · Ships never</p>
              <p>
                Receipt #{String(receipt.number).padStart(4, '0')} · {new Date(receipt.printedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </header>
            <ul className='receipt__items'>
              {receipt.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.amount} × {item.title}
                  </span>
                  <span>{formatMoney(item.amount * item.price)}</span>
                </li>
              ))}
            </ul>
            <div className='receipt__totals'>
              <p>
                <span>Subtotal</span>
                <span>{formatMoney(receipt.subtotal)}</span>
              </p>
              {receipt.coupon ? (
                <p>
                  <span>Coupon {COUPONS[receipt.coupon].name}</span>
                  <span>−{formatMoney(receipt.subtotal - receipt.total)}</span>
                </p>
              ) : null}
              <p className='receipt__total'>
                <span>TOTAL</span>
                <span>{formatMoney(receipt.total)}</span>
              </p>
            </div>
            <p className='receipt__stamps'>
              <span aria-hidden='true'>{'★'.repeat(Math.min(receipt.stampsEarned, 12))}</span>
              <br />+{receipt.stampsEarned} stamp{receipt.stampsEarned === 1 ? '' : 's'} · income now +{Math.round(totalStamps * STAMP_BONUS * 100)}% forever
            </p>
            <Barcode seed={receipt.number} />
            <p className='receipt__foot'>Nothing will ship. Thank you!</p>
          </article>
          <button type='button' className='chunky chunky--primary receipt__done' onClick={close}>
            Back to shopping
          </button>
        </>
      ) : null}
    </Sheet>
  );
}

export default ReceiptSheet;
