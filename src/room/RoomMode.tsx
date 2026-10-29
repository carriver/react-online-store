import { useMemo, useState, type CSSProperties } from 'react';

import type { Product } from '../cart';
import { categoryLabel, formatRate, roomSlots, type RoomSlot } from '../catalog';
import Catalog from '../components/Catalog';
import { incomeMultiplier, itemYieldPerSecond } from '../game/economy';
import { useGameSelector } from '../game/GameProvider';
import Mochi from './Mochi';
import RoomBackdrop from './RoomBackdrop';
import './room.css';

const percent = (value: number, total: number) => `${(value / total) * 100}%`;

const slotStyle = (slot: RoomSlot, index: number) =>
  ({
    '--x': percent(slot.x, 800),
    '--y': percent(slot.y, 560),
    '--tilt': `${slot.tilt}deg`,
    '--delay': `${(index * 0.73) % 3.2}s`,
  }) as CSSProperties;

function RoomScene({ products }: { products: Product[] }) {
  const cart = useGameSelector((state) => state.cart);
  const vibes = useGameSelector((state) => state.perks.vibes);
  const stamps = useGameSelector((state) => state.stamps);
  const slots = useMemo(() => roomSlots(products), [products]);
  const owned = new Map(cart.map((item) => [item.id, item.amount]));
  const multiplier = incomeMultiplier(vibes, stamps);

  return (
    <section className='room-scene' aria-label={`Your room, ${owned.size} of ${products.length} products on display`}>
      <RoomBackdrop />
      {products.map((product, index) => {
        const slot = slots.get(product.id);
        if (!slot) return null;
        const amount = owned.get(product.id);
        if (!amount) {
          return <span key={`ghost-${product.id}`} className={`room-ghost room-ghost--${slot.zone}`} style={slotStyle(slot, index)} aria-hidden='true' />;
        }
        return (
          <figure key={`item-${product.id}`} className={`room-item room-item--${slot.zone}`} style={slotStyle(slot, index)}>
            <img src={product.image} alt={product.title} width='80' height='100' decoding='async' />
            {amount > 1 ? <span className='room-item__amount'>×{amount}</span> : null}
            <span className='room-item__yield' aria-hidden='true'>
              {formatRate(itemYieldPerSecond(product.price) * amount * multiplier).replace('/s', '')}
            </span>
          </figure>
        );
      })}
      <Mochi />
    </section>
  );
}

function RoomMode({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(products.map((product) => product.category))], [products]);
  const shown = category ? products.filter((product) => product.category === category) : products;

  return (
    <div className='room-mode'>
      <div className='room-mode__stage'>
        <RoomScene products={products} />
        <p className='room-mode__hint'>
          Tap Mochi for coins. Spend them on items, and each item earns coins every second, even while you’re away.
        </p>
      </div>
      <Catalog
        products={shown}
        totalProducts={products.length}
        filters={
          <div className='catalog__filters' role='group' aria-label='Filter by category'>
            {[null, ...categories].map((option) => (
              <button
                key={option ?? 'all'}
                type='button'
                className='catalog__filter'
                aria-pressed={category === option}
                onClick={() => setCategory(option)}>
                {option ? categoryLabel(option) : 'All'}
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
}

export default RoomMode;
