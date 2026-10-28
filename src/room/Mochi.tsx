import { useEffect, useState, type MouseEvent } from 'react';

import { coinsPerTap } from '../game/economy';
import { centerOf, useGame } from '../game/GameProvider';

const LINES = [
  'Nothing here ships. Isn’t that freeing?',
  'Tap me. For coins. Totally normal.',
  'Every item you own pays rent. In coins.',
  'I was told the ring is real. I was lied to.',
  'Check out to earn stamps. Stamps are forever.',
  'Come back later. Your stuff keeps earning.',
  'The jacket on the rail has a lot of opinions.',
];

const LINE_INTERVAL_MS = 7000;

function Mochi() {
  const { dispatch, sfx, pop, getState } = useGame();
  const [lineIndex, setLineIndex] = useState(0);
  const [squish, setSquish] = useState(0);

  useEffect(() => {
    const rotate = window.setInterval(() => setLineIndex((index) => (index + 1) % LINES.length), LINE_INTERVAL_MS);
    return () => window.clearInterval(rotate);
  }, []);

  const pet = (event: MouseEvent<HTMLButtonElement>) => {
    const earned = coinsPerTap(getState().perks.thumb);
    dispatch({ type: 'tap' });
    sfx('tap');
    setSquish((count) => count + 1);
    const at = event.clientX || event.clientY ? { x: event.clientX, y: event.clientY - 20 } : centerOf(event.currentTarget);
    pop(`+${earned}`, at);
  };

  return (
    <div className='mochi'>
      <p className='mochi__bubble' key={lineIndex}>
        {LINES[lineIndex]}
      </p>
      <button type='button' className='mochi__button' onClick={pet} aria-label='Pet Mochi the shopkeeper to earn coins'>
        <svg key={squish} className='mochi__body' viewBox='0 0 140 120' aria-hidden='true' focusable='false'>
          <path className='mochi__tail' d='M112 92c22-4 26-28 12-36' />
          <path className='mochi__fur' d='M26 44 36 6l26 24zM114 44 104 6 78 30z' />
          <path className='mochi__fur' d='M14 82c0-34 24-56 56-56s56 22 56 56c0 22-18 30-56 30S14 104 14 82z' />
          <path className='mochi__ear-inner' d='M37 26l3-11 9 8zM103 26l-3-11-9 8z' />
          <g className='mochi__eyes'>
            <ellipse cx='52' cy='68' rx='6' ry='8' />
            <ellipse cx='88' cy='68' rx='6' ry='8' />
          </g>
          <ellipse cx='40' cy='84' rx='9' ry='5' className='mochi__cheek' />
          <ellipse cx='100' cy='84' rx='9' ry='5' className='mochi__cheek' />
          <path className='mochi__mouth' d='M62 82q4 5 8 0q4 5 8 0' />
        </svg>
      </button>
    </div>
  );
}

export default Mochi;
