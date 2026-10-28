import type { MouseEvent, ReactNode } from 'react';

import type { Product } from '../cart';
import { categoryLabel, formatMoney, formatRate } from '../catalog';
import { discoveryBonus, itemYieldPerSecond } from '../game/economy';
import { centerOf, useGame, useGameSelector } from '../game/GameProvider';
import './Catalog.css';

function CatalogRow({ product, amount, isNew }: { product: Product; amount: number; isNew: boolean }) {
  const { dispatch, sfx, pop } = useGame();

  const add = (event: MouseEvent<HTMLButtonElement>) => {
    dispatch({ type: 'add', product });
    sfx(isNew ? 'coin' : 'add');
    pop(isNew ? `First find! +${discoveryBonus(product)}` : 'Moved in!', centerOf(event.currentTarget), isNew ? 'coin' : 'info');
  };

  return (
    <li className='catalog-row'>
      <img className='catalog-row__image' src={product.image} alt='' width='64' height='64' loading='lazy' decoding='async' />
      <div className='catalog-row__info'>
        <h3 className='catalog-row__title'>{product.title}</h3>
        <p className='catalog-row__meta'>
          <span>{categoryLabel(product.category)}</span>
          <span className='catalog-row__yield'>{formatRate(itemYieldPerSecond(product.price))}</span>
          {isNew ? <span className='catalog-row__new'>New · +{discoveryBonus(product)}</span> : null}
          {amount > 0 ? <span className='catalog-row__owned'>{amount} owned</span> : null}
        </p>
      </div>
      <div className='catalog-row__buy'>
        <span className='catalog-row__price'>{formatMoney(product.price)}</span>
        <button type='button' className='chunky chunky--small chunky--primary' onClick={add} aria-label={`Add ${product.title} to cart`}>
          Add
        </button>
      </div>
    </li>
  );
}

function Catalog({ products, totalProducts, filters }: { products: Product[]; totalProducts: number; filters?: ReactNode }) {
  const cart = useGameSelector((state) => state.cart);
  const discovered = useGameSelector((state) => state.discovered);
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
