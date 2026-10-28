import type { MouseEvent } from 'react';

import { formatCoins, formatDuration } from '../catalog';
import { offlineCapSeconds } from '../game/economy';
import { centerOf, useGame, useGameSelector } from '../game/GameProvider';
import CoinIcon from './CoinIcon';
import Sheet from './Sheet';

function WelcomeBack() {
  const away = useGameSelector((state) => state.awayEarnings);
  const capSeconds = useGameSelector((state) => offlineCapSeconds(state.perks.hopper));
  const { dispatch, sfx, pop } = useGame();

  const collect = (event?: MouseEvent<HTMLButtonElement>) => {
    if (!away) return;
    dispatch({ type: 'collectAwayEarnings' });
    sfx('coin');
    if (event) pop(`+${formatCoins(away.coins)}`, centerOf(event.currentTarget));
  };

  return (
    <Sheet open={away !== null} onClose={() => collect()} title='Welcome back!' placement='center' closeLabel='Collect and close'>
      {away ? (
        <div className='welcome-back'>
          <div className='welcome-back__coins' aria-hidden='true'>
            {Array.from({ length: 5 }, (_, index) => (
              <CoinIcon key={index} className='welcome-back__coin' />
            ))}
          </div>
          <p>
            You were gone for <b>{formatDuration(away.seconds)}</b>. Your stuff kept earning and saved you{' '}
            <b>{formatCoins(away.coins)} coins</b>.
          </p>
          {away.seconds > capSeconds ? (
            <p className='welcome-back__cap'>
              Your hopper only holds {formatDuration(capSeconds)} of earnings. A Deeper hopper perk banks more next time.
            </p>
          ) : null}
          <button type='button' className='chunky chunky--butter welcome-back__collect' onClick={collect}>
            <CoinIcon /> Collect {formatCoins(away.coins)}
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}

export default WelcomeBack;
