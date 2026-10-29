import type { MouseEvent } from 'react';

import { formatCoins } from '../catalog';
import { COUPONS, PERKS, THEMES, perkCost, type CouponId, type PerkId, type ThemeId } from '../game/economy';
import { centerOf, useGame, useGameSelector } from '../game/GameProvider';
import CoinIcon from './CoinIcon';
import Sheet from './Sheet';
import './PerksSheet.css';

function Price({ cost, coins }: { cost: number; coins: number }) {
  return (
    <span className='perk__price'>
      <CoinIcon />
      {formatCoins(cost)}
      {coins < cost ? <span className='perk__short'>need {formatCoins(cost - coins)} more</span> : null}
    </span>
  );
}

function PerksSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const coins = useGameSelector((state) => Math.floor(state.coins));
  const perks = useGameSelector((state) => state.perks);
  const coupons = useGameSelector((state) => state.coupons);
  const appliedCoupon = useGameSelector((state) => state.appliedCoupon);
  const ownedThemes = useGameSelector((state) => state.ownedThemes);
  const theme = useGameSelector((state) => state.theme);
  const { dispatch, sfx, pop } = useGame();

  const celebrate = (event: MouseEvent<HTMLButtonElement>, text: string) => {
    sfx('buy');
    pop(text, centerOf(event.currentTarget), 'info');
  };

  return (
    <Sheet open={open} onClose={onClose} title='Perks' closeLabel='Close perks'>
      <p className='perks__balance'>
        <CoinIcon /> {formatCoins(coins)} coins to spend
      </p>

      <section className='perks__section' aria-labelledby='perks-upgrades'>
        <h3 id='perks-upgrades'>Upgrades</h3>
        {(Object.keys(PERKS) as PerkId[]).map((perk) => {
          const level = perks[perk];
          const maxed = level >= PERKS[perk].maxLevel;
          const cost = perkCost(perk, level);
          return (
            <div key={perk} className='perk'>
              <div>
                <h4>
                  {PERKS[perk].name} <span className='perk__level'>Lv {level}</span>
                </h4>
                <p>{PERKS[perk].blurb}</p>
              </div>
              <div className='perk__buy'>
                {maxed ? <span className='perk__price'>Maxed</span> : <Price cost={cost} coins={coins} />}
                <button
                  type='button'
                  className='chunky chunky--small chunky--mint'
                  disabled={maxed || coins < cost}
                  onClick={(event) => {
                    dispatch({ type: 'buyPerk', perk });
                    celebrate(event, `Lv ${level + 1}!`);
                  }}
                  aria-label={`Buy ${PERKS[perk].name} level ${level + 1}`}>
                  Buy
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className='perks__section' aria-labelledby='perks-coupons'>
        <h3 id='perks-coupons'>Coupons</h3>
        <p className='perks__note'>
          A coupon takes its discount off every item you buy until your next checkout. One at a time; extras wait in your cart. Yes, the
          discount is as real as the store.
        </p>
        {(Object.keys(COUPONS) as CouponId[]).map((coupon) => {
          const owned = coupons.filter((entry) => entry === coupon).length;
          return (
            <div key={coupon} className='perk perk--coupon'>
              <div>
                <h4>
                  {COUPONS[coupon].name}
                  {appliedCoupon === coupon ? <span className='perk__level'>Active</span> : null}
                  {owned ? <span className='perk__level'>{owned} saved</span> : null}
                </h4>
              </div>
              <div className='perk__buy'>
                <Price cost={COUPONS[coupon].cost} coins={coins} />
                <button
                  type='button'
                  className='chunky chunky--small chunky--mint'
                  disabled={coins < COUPONS[coupon].cost}
                  onClick={(event) => {
                    dispatch({ type: 'buyCoupon', coupon });
                    celebrate(event, 'Clipped!');
                  }}
                  aria-label={`Buy a ${COUPONS[coupon].name} coupon`}>
                  Buy
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className='perks__section' aria-labelledby='perks-themes'>
        <h3 id='perks-themes'>Themes</h3>
        <div className='themes'>
          {(Object.keys(THEMES) as ThemeId[]).map((option) => {
            const owned = ownedThemes.includes(option);
            const affordable = coins >= THEMES[option].cost;
            return (
              <button
                key={option}
                type='button'
                className={`theme-swatch theme-swatch--${option}`}
                aria-pressed={theme === option}
                disabled={!owned && !affordable}
                onClick={(event) => {
                  dispatch({ type: 'chooseTheme', theme: option });
                  if (!owned) celebrate(event, 'Redecorated!');
                  else sfx('tap');
                }}>
                <span className='theme-swatch__colors' aria-hidden='true'>
                  <i />
                  <i />
                  <i />
                </span>
                <span className='theme-swatch__name'>{THEMES[option].name}</span>
                <span className='theme-swatch__cost'>
                  {owned ? (theme === option ? 'In use' : 'Owned') : (
                    <>
                      <CoinIcon /> {formatCoins(THEMES[option].cost)}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </Sheet>
  );
}

export default PerksSheet;
