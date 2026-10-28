import { cartTotal, countItems } from '../cart';
import { formatMoney } from '../catalog';
import { COUPONS, STAMP_BONUS, discountedTotal, stampsForCheckout, type CouponId } from '../game/economy';
import { useGame, useGameSelector } from '../game/GameProvider';
import Sheet from './Sheet';
import './CartSheet.css';

function CartSheet({ open, onClose, onOpenPerks }: { open: boolean; onClose: () => void; onOpenPerks: () => void }) {
  const cart = useGameSelector((state) => state.cart);
  const coupons = useGameSelector((state) => state.coupons);
  const appliedCoupon = useGameSelector((state) => state.appliedCoupon);
  const { dispatch, sfx } = useGame();
  const subtotal = cartTotal(cart);
  const total = discountedTotal(subtotal, appliedCoupon);
  const ownedCoupons = [...new Set(coupons)];
  const countOf = (coupon: CouponId) => coupons.filter((owned) => owned === coupon).length;

  const checkout = () => {
    sfx('buy');
    onClose();
    dispatch({ type: 'checkout', now: Date.now() });
  };

  return (
    <Sheet open={open} onClose={onClose} title='Your Shopping Cart' closeLabel='Close cart'>
      {cart.length === 0 ? (
        <div className='cart-empty'>
          <svg viewBox='0 0 120 90' aria-hidden='true'>
            <path d='M10 14h16l12 50h56l12-36H32' fill='none' stroke='currentColor' strokeWidth='6' strokeLinejoin='round' strokeLinecap='round' />
            <circle cx='46' cy='78' r='7' fill='currentColor' />
            <circle cx='86' cy='78' r='7' fill='currentColor' />
          </svg>
          <p>Your cart is emptier than a fake store.</p>
        </div>
      ) : (
        <ul className='cart-list'>
          {cart.map((item) => (
            <li key={item.id} className='cart-line'>
              <img src={item.image} alt='' width='56' height='56' loading='lazy' decoding='async' />
              <div className='cart-line__info'>
                <h3>{item.title}</h3>
                <p>
                  {formatMoney(item.price)} each · <b>{formatMoney(item.price * item.amount)}</b>
                </p>
              </div>
              <div className='stepper' role='group' aria-label={`Quantity of ${item.title}`}>
                <button type='button' onClick={() => dispatch({ type: 'remove', productId: item.id })} aria-label={`Remove one ${item.title}`}>
                  −
                </button>
                <output aria-live='polite'>{item.amount}</output>
                <button type='button' onClick={() => dispatch({ type: 'add', product: item })} aria-label={`Add one more ${item.title}`}>
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className='cart-coupons' aria-label='Coupons'>
        {ownedCoupons.length === 0 ? (
          <p className='cart-coupons__hint'>
            No coupons yet.{' '}
            <button type='button' className='link-button' onClick={onOpenPerks}>
              Spend coins on one
            </button>
            .
          </p>
        ) : (
          <div className='cart-coupons__list' role='group' aria-label='Apply a coupon'>
            {ownedCoupons.map((coupon) => (
              <button
                key={coupon}
                type='button'
                className='coupon-chip'
                aria-pressed={appliedCoupon === coupon}
                onClick={() => dispatch({ type: 'applyCoupon', coupon: appliedCoupon === coupon ? null : coupon })}>
                {COUPONS[coupon].name}
                {countOf(coupon) > 1 ? ` ×${countOf(coupon)}` : ''}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className='cart-totals'>
        <p>
          <span>Subtotal ({countItems(cart)} items)</span>
          <span>{formatMoney(subtotal)}</span>
        </p>
        {appliedCoupon ? (
          <p className='cart-totals__discount'>
            <span>Coupon {COUPONS[appliedCoupon].name}</span>
            <span>−{formatMoney(subtotal - total)}</span>
          </p>
        ) : null}
        <h2 className='cart-totals__total'>Total: {formatMoney(total)}</h2>
      </div>

      {cart.length > 0 ? (
        <>
          <p className='cart-stamps'>
            Checking out earns <b>{stampsForCheckout(total)} stamp{stampsForCheckout(total) === 1 ? '' : 's'}</b>, each a permanent +
            {STAMP_BONUS * 100}% income. Your room empties, your coins stay.
          </p>
          <button type='button' className='chunky chunky--primary cart-checkout' onClick={checkout}>
            Check out (nothing ships)
          </button>
        </>
      ) : null}
    </Sheet>
  );
}

export default CartSheet;
