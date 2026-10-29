import type { MouseEvent, ReactNode } from 'react';

import { countItems, type Product } from '../cart';
import { categoryLabel, formatCoins, formatCoinsPerSecond } from '../catalog';
import { COUPONS, itemYieldPerSecond, listPrice } from '../game/economy';
import { centerOf, useGame, useGameSelector } from '../game/GameProvider';
import { nextItemCost } from '../game/state';
import CoinIcon from './CoinIcon';
import './Catalog.css';

function CatalogRow({ product, amount, isNew }: { product: Product; amount: number; isNew: boolean }) {
  const { dispatch, sfx, pop } = useGame();
  const cost = useGameSelector((state) => nextItemCost(state, product));
  const totalOwned = useGameSelector((state) => countItems(state.cart));
  const fullPrice = listPrice(product, amount, totalOwned);
  const shortBy = useGameSelector((state) => Math.max(0, Math.ceil(cost - state.coins)));

  const buy = (event: MouseEvent<HTMLButtonElement>) => {
    dispatch({ type: 'buy', product });
    sfx(isNew ? 'coin' : 'add');
    pop(isNew ? 'New find! Moved in' : 'Moved in!', centerOf(event.currentTarget), 'info');
  };

  return (
    <li className='catalog-row'>
      <img className='catalog-row__image' src={product.image} alt='' width='64' height='64' loading='lazy' decoding='async' />
      <div className='catalog-row__info'>
        <h3 className='catalog-row__title'>{product.title}</h3>
        <p className='catalog-row__meta'>
          <span>{categoryLabel(product.category)}</span>
          <span className='catalog-row__yield'>Earns {formatCoinsPerSecond(itemYieldPerSecond(product.price))}</span>
          {isNew ? <span className='catalog-row__new'>New</span> : null}
          {amount > 0 ? <span className='catalog-row__owned'>{amount} owned</span> : null}
        </p>
      </div>
      <div className='catalog-row__buy'>
        <span className='catalog-row__price'>
          {cost < fullPrice ? (
            <s className='catalog-row__was'>
              <span className='visually-hidden'>was </span>
              {formatCoins(fullPrice)}
            </s>
          ) : null}
          <CoinIcon />
          {formatCoins(cost)}
        </span>
        <button
          type='button'
          className='chunky chunky--small chunky--primary catalog-row__button'
          onClick={buy}
          disabled={shortBy > 0}
          aria-label={shortBy > 0 ? `${product.title}: need ${formatCoins(shortBy)} more coins` : `Buy ${product.title} for ${formatCoins(cost)} coins`}>
          {shortBy > 0 ? `Need ${formatCoins(shortBy)}` : 'Buy'}
        </button>
      </div>
    </li>
  );
}

function Catalog({ products, totalProducts, filters }: { products: Product[]; totalProducts: number; filters?: ReactNode }) {
  const cart = useGameSelector((state) => state.cart);
  const discovered = useGameSelector((state) => state.discovered);
  const appliedCoupon = useGameSelector((state) => state.appliedCoupon);
  const amounts = new Map(cart.map((item) => [item.id, item.amount]));
  const found = discovered.length;

  return (
    <aside className='catalog' aria-labelledby='catalog-title'>
      <header className='catalog__header'>
        <h2 id='catalog-title'>Catalog</h2>
        <div className='catalog__progress' aria-label={`Collected ${found} of ${totalProducts}`}>
          <span aria-hidden='true'>
            Collected {found}/{totalProducts}
          </span>
          <span className='catalog__bar' aria-hidden='true'>
            <span style={{ transform: `scaleX(${totalProducts ? found / totalProducts : 0})` }} />
          </span>
        </div>
        {appliedCoupon ? (
          <p className='catalog__coupon'>
            <b>{COUPONS[appliedCoupon].name}</b> everything until checkout
          </p>
        ) : null}
        {filters}
      </header>
      <ul className='catalog__list'>
        {products.map((product) => (
          <CatalogRow
            key={product.id}
            product={product}
            amount={amounts.get(product.id) ?? 0}
            isNew={!discovered.includes(product.id)}
          />
        ))}
      </ul>
    </aside>
  );
}

export default Catalog;
