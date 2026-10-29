import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';

import { productsQuery } from '../api';
import CoinIcon from '../components/CoinIcon';
import './Landing.css';

const preloadStore = () => import('./Store');

const SQUIGGLE_PATH = 'M8 16c10-13 20-13 29 0s19 13 29 0 19-13 29 0 19 13 29 0';

const titleWords = ['FAKE', 'ONLINE', 'STORE'].map((word, wordIndex, words) => {
  const firstOrder = words.slice(0, wordIndex).join('').length;
  return word.split('').map((letter, letterIndex) => ({ letter, order: firstOrder + letterIndex }));
});

function RoomDoorArt() {
  return (
    <svg viewBox='0 0 200 130' aria-hidden='true' focusable='false'>
      <rect width='200' height='96' fill='var(--wall)' />
      <rect y='96' width='200' height='34' fill='var(--floor)' />
      <rect x='18' y='18' width='54' height='40' rx='3' fill='var(--window-sky)' stroke='var(--line)' strokeWidth='3' />
      <line x1='92' x2='180' y1='30' y2='30' stroke='#7c7f8e' strokeWidth='4' strokeLinecap='round' />
      {[102, 124, 146, 168].map((x, index) => (
        <g key={x} className='door-art__garment' style={{ animationDelay: `${index * 0.2}s` }}>
          <path d={`M${x - 6} 38q6-8 12 0`} fill='none' stroke='var(--line)' strokeWidth='2' />
          <rect x={x - 9} y='38' width='18' height='26' rx='3' fill={['var(--tomato)', 'var(--sky)', 'var(--mint)', 'var(--butter)'][index]} stroke='var(--line)' strokeWidth='2.5' />
        </g>
      ))}
      <ellipse cx='58' cy='112' rx='40' ry='9' fill='var(--butter)' stroke='var(--line)' strokeWidth='2.5' />
      <g className='door-art__cat'>
        <path d='M42 90l4-12 8 8M74 90l-4-12-8 8' fill='#fff7ec' stroke='var(--line)' strokeWidth='2.5' strokeLinejoin='round' />
        <path d='M38 102c0-12 9-20 20-20s20 8 20 20c0 8-7 10-20 10s-20-2-20-10z' fill='#fff7ec' stroke='var(--line)' strokeWidth='2.5' />
        <circle cx='51' cy='97' r='2.4' fill='var(--line)' />
        <circle cx='65' cy='97' r='2.4' fill='var(--line)' />
      </g>
    </svg>
  );
}

function MachineDoorArt() {
  return (
    <svg viewBox='0 0 200 130' aria-hidden='true' focusable='false'>
      <rect width='200' height='130' fill='var(--paper-deep)' />
      <rect x='46' y='8' width='108' height='118' rx='12' fill='var(--machine)' stroke='var(--line)' strokeWidth='3' />
      <rect x='56' y='18' width='62' height='78' rx='6' fill='#2b2238' stroke='var(--line)' strokeWidth='2.5' />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((column) => (
          <rect
            key={`${row}-${column}`}
            className='door-art__snack'
            x={62 + column * 18}
            y={24 + row * 24}
            width='13'
            height='15'
            rx='2'
            fill={['var(--butter)', 'var(--sky)', 'var(--mint)'][(row + column) % 3]}
            stroke='var(--line)'
            strokeWidth='1.5'
            style={{ animationDelay: `${(row * 3 + column) * 0.15}s` }}
          />
        )),
      )}
      <rect x='124' y='18' width='22' height='12' rx='2' fill='var(--lcd)' stroke='var(--line)' strokeWidth='2' />
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <circle cx='130' cy={42 + row * 12} r='3.5' fill='var(--surface)' stroke='var(--line)' strokeWidth='1.5' />
          <circle cx='140' cy={42 + row * 12} r='3.5' fill='var(--surface)' stroke='var(--line)' strokeWidth='1.5' />
        </g>
      ))}
      <rect x='56' y='102' width='88' height='16' rx='4' fill='#1d1420' stroke='var(--line)' strokeWidth='2.5' />
    </svg>
  );
}

function Landing() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Most visitors click straight through, so fetch the catalog and the store code up front.
    void queryClient.prefetchQuery(productsQuery);
    void preloadStore();
  }, [queryClient]);

  return (
    <div className='landing'>
      <div className='landing__shapes' aria-hidden='true'>
        <span className='shape shape--blob' />
        <span className='shape shape--ring' />
        <svg className='shape shape--squiggle' viewBox='0 0 132 32' focusable='false'>
          <path className='squiggle__outline' d={SQUIGGLE_PATH} />
          <path className='squiggle__line' d={SQUIGGLE_PATH} />
        </svg>
        <CoinIcon className='shape shape--coin' />
        <CoinIcon className='shape shape--coin shape--coin-2' />
      </div>

      <main className='landing__main'>
        <p className='landing__eyebrow'>An idle shop where nothing ships</p>
        <h1 className='landing__title' aria-label='Fake Online Store'>
          {titleWords.map((letters, wordIndex) => (
            <span key={wordIndex} className='landing__word' aria-hidden='true'>
              {letters.map(({ letter, order }) => (
                <span
                  key={order}
                  className={order % 2 === 1 ? 'landing__letter landing__letter--alt' : 'landing__letter'}
                  style={{ animationDelay: `${order * 55}ms` }}>
                  {letter}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className='landing__lede'>
          Furnish a cozy room or work a vending machine. Spend coins on items, and everything you own earns more coins, even
          while you’re away.
        </p>

        <div className='landing__doors'>
          <Link to='/store?mode=room' className='door door--room'>
            <RoomDoorArt />
            <span className='door__label'>
              <b>Cozy Room</b>
              Furnish it. It pays rent.
            </span>
          </Link>
          <Link to='/store?mode=machine' className='door door--machine'>
            <MachineDoorArt />
            <span className='door__label'>
              <b>Fake-o-Mat</b>
              Punch codes. Shake for coins.
            </span>
          </Link>
        </div>

        <Link to='/store' className='chunky chunky--primary landing__start'>
          Click here to start shopping
        </Link>
      </main>

      <footer className='landing__footer'>
        Products from the{' '}
        <a href='https://fakestoreapi.com/' rel='noreferrer'>
          Fake Store API
        </a>
        . A portfolio project by{' '}
        <a href='https://www.carlosriver.com/' rel='noreferrer'>
          Carlos Rivera
        </a>
        .
      </footer>
    </div>
  );
}

export default Landing;
