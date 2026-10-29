import { countItems, refundForOne, type CartItemType } from '../cart';
import { formatCoins, formatCoinsPerSecond } from '../catalog';
import { COUPONS, STAMP_BONUS, cartValue, itemYieldPerSecond, stampsForCheckout } from '../game/economy';
import { useGame, useGameSelector } from '../game/GameProvider';
import { nextItemCost } from '../game/state';
import Sheet from './Sheet';
import './CartSheet.css';

function CartLine({ item }: { item: CartItemType }) {
  const { dispatch } = useGame();
  const cost = useGameSelector((state) => nextItemCost(state, item));
  const affordable = useGameSelector((state) => state.coins >= cost);
  const refund = refundForOne(item);

  return (
    <li className='cart-line'>
      <img src={item.image} alt='' width='56' height='56' loading='lazy' decoding='async' />
      <div className='cart-line__info'>
        <h3>{item.title}</h3>
        <p>
          {formatCoins(item.paid)} coins spent · earns <b>{formatCoinsPerSecond(item.amount * itemYieldPerSecond(item.price))}</b>
        </p>
      </div>
      <div className='stepper' role='group' aria-label={`Quantity of ${item.title}`}>
        <button
          type='button'
          onClick={() => dispatch({ type: 'remove', productId: item.id })}
          aria-label={`Sell one ${item.title} back for ${formatCoins(refund)} coins`}>
          −
        </button>
        <output aria-live='polite'>{item.amount}</output>
        <button
          type='button'
          disabled={!affordable}
          onClick={() => dispatch({ type: 'buy', product: item })}
          aria-label={`Buy one more ${item.title} for ${formatCoins(cost)} coins`}>
          +
        </button>
      </div>
    </li>
  );
}

function Coupons({ onOpenPerks }: { onOpenPerks: () => void }) {
  const appliedCoupon = useGameSelector((state) => state.appliedCoupon);

  return (
    <section className='cart-coupons' aria-label='Coupons'>
      {appliedCoupon ? (
        <p className='cart-coupons__active'>
          <b>{COUPONS[appliedCoupon].name}</b> coupon active: every item you buy costs {COUPONS[appliedCoupon].percentOff}% less until you
          check out.
        </p>
      ) : (
        <p className='cart-coupons__hint'>
          No coupon yet.{' '}
          <button type='button' className='link-button' onClick={onOpenPerks}>
            Spend coins on one
          </button>{' '}
          to make items cheaper.
        </p>
      )}
    </section>
  );
}

function CartSheet({ open, onClose, onOpenPerks }: { open: boolean; onClose: () => void; onOpenPerks: () => void }) {
  const cart = useGameSelector((state) => state.cart);
  const { dispatch, sfx } = useGame();
  const value = cartValue(cart);
  const spent = cart.reduce((total, item) => total + item.paid, 0);
  const stamps = stampsForCheckout(value);

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
            <CartLine key={item.id} item={item} />
          ))}
        </ul>
      )}

      <Coupons onOpenPerks={onOpenPerks} />

      {cart.length > 0 ? (
        <>
          <div className='cart-totals'>
            <p>
              <span>Items ({countItems(cart)})</span>
              <span>{formatCoins(value)} coins of stuff</span>
            </p>
            <p>
              <span>You spent</span>
              <span>{formatCoins(spent)} coins</span>
            </p>
            <h2 className='cart-totals__total'>
              Checkout earns {stamps} stamp{stamps === 1 ? '' : 's'}
            </h2>
          </div>
          <p className='cart-stamps'>
            Each stamp is a permanent +{STAMP_BONUS * 100}% income. Checking out empties your room and the coins you spent are gone, but
            your coin balance stays.
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
