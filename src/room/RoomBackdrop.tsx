import { memo } from 'react';

// The room never changes with game state, so it is memoized and drawn once.
function RoomBackdrop() {
  return (
    <svg className='room-backdrop' viewBox='0 0 800 560' aria-hidden='true' focusable='false'>
      <defs>
        <pattern id='room-dots' width='28' height='28' patternUnits='userSpaceOnUse'>
          <circle cx='5' cy='5' r='2.6' className='scene-wall-dot' />
          <circle cx='19' cy='19' r='2.6' className='scene-wall-dot' />
        </pattern>
        <clipPath id='room-window'>
          <rect x='134' y='44' width='192' height='142' rx='6' />
        </clipPath>
      </defs>

      <rect width='800' height='410' className='scene-wall' />
      <rect width='800' height='410' fill='url(#room-dots)' />

      <rect y='402' width='800' height='158' className='scene-floor' />
      {[446, 492, 538].map((y) => (
        <line key={y} x1='0' x2='800' y1={y} y2={y} className='scene-floor-line' />
      ))}
      {[[120, 402, 446], [430, 402, 446], [260, 446, 492], [640, 446, 492], [90, 492, 538], [520, 492, 538], [350, 538, 560]].map(
        ([x, top, bottom]) => (
          <line key={`${x}-${top}`} x1={x} x2={x} y1={top} y2={bottom} className='scene-floor-line' />
        ),
      )}
      <rect x='-4' y='396' width='808' height='14' className='scene-trim' />

      <g className='scene-window'>
        <rect x='134' y='44' width='192' height='142' rx='6' className='scene-sky' />
        <g clipPath='url(#room-window)'>
          <circle cx='286' cy='86' r='20' className='scene-sun' />
          <g className='scene-clouds'>
            <path d='M150 120a14 14 0 0 1 26-6 11 11 0 0 1 18 9h-44z' className='scene-cloud' />
            <path d='M230 82a12 12 0 0 1 22-5 9 9 0 0 1 15 8h-37z' className='scene-cloud' />
            <path d='M350 140a14 14 0 0 1 26-6 11 11 0 0 1 18 9h-44z' className='scene-cloud' />
          </g>
        </g>
        <rect x='134' y='44' width='192' height='142' rx='6' className='scene-frame' />
        <line x1='230' x2='230' y1='44' y2='186' className='scene-frame' />
        <line x1='134' x2='326' y1='115' y2='115' className='scene-frame' />
        <rect x='122' y='184' width='216' height='12' rx='4' className='scene-wood' />
      </g>

      <g className='scene-sign'>
        <line x1='600' x2='594' y1='22' y2='0' className='scene-wire' />
        <line x1='716' x2='722' y1='22' y2='0' className='scene-wire' />
        <rect x='562' y='20' width='192' height='50' rx='25' className='scene-sign-board' />
        <text x='658' y='54' textAnchor='middle' className='scene-sign-text'>
          OPEN 25/8
        </text>
      </g>

      <g className='scene-shelf'>
        <rect x='528' y='170' width='248' height='13' rx='3' className='scene-wood' />
        <path d='M548 183l0 22 22-22z M736 183l0 22 22-22z' className='scene-wood' />
      </g>

      <g className='scene-rack'>
        <line x1='44' x2='44' y1='220' y2='474' className='scene-metal' />
        <line x1='404' x2='404' y1='220' y2='474' className='scene-metal' />
        <line x1='36' x2='412' y1='222' y2='222' className='scene-metal scene-metal--bar' />
        <line x1='22' x2='66' y1='474' y2='474' className='scene-metal' />
        <line x1='382' x2='426' y1='474' y2='474' className='scene-metal' />
        <circle cx='26' cy='482' r='7' className='scene-wheel' />
        <circle cx='62' cy='482' r='7' className='scene-wheel' />
        <circle cx='386' cy='482' r='7' className='scene-wheel' />
        <circle cx='422' cy='482' r='7' className='scene-wheel' />
      </g>

      <g className='scene-desk'>
        <rect x='540' y='272' width='180' height='10' rx='3' className='scene-wood' />
        <rect x='552' y='282' width='8' height='58' className='scene-wood-dark' />
        <rect x='700' y='282' width='8' height='58' className='scene-wood-dark' />
        <rect x='486' y='340' width='306' height='18' rx='4' className='scene-wood' />
        <rect x='500' y='358' width='14' height='118' className='scene-wood-dark' />
        <rect x='764' y='358' width='14' height='118' className='scene-wood-dark' />
      </g>

      <g className='scene-plant'>
        <path d='M448 408c-30-40-36-80-8-104 6 34 14 60 8 104z' className='scene-leaf' />
        <path d='M450 408c10-46 36-72 66-74-10 30-34 56-66 74z' className='scene-leaf' />
        <path d='M446 410c-20-28-50-38-76-30 18 22 44 32 76 30z' className='scene-leaf scene-leaf--dark' />
        <path d='M422 404h56l-8 64h-40z' className='scene-pot' />
        <rect x='416' y='398' width='68' height='14' rx='4' className='scene-pot' />
      </g>

      <ellipse cx='300' cy='512' rx='176' ry='34' className='scene-rug' />
      <ellipse cx='300' cy='512' rx='138' ry='24' className='scene-rug-stripe' />
    </svg>
  );
}

export default memo(RoomBackdrop);
