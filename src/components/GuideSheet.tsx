import { STAMP_BONUS } from '../game/economy';
import { useGame, useGameSelector } from '../game/GameProvider';
import Sheet from './Sheet';
import './GuideSheet.css';

const STEPS = [
  { title: 'Earn coins', body: 'Tap Mochi in the Cozy Room, or shake the Fake-o-Mat. Every tap pays.' },
  {
    title: 'Buy items',
    body: 'Spend coins on items. Each one earns coins every second, even while you’re away (up to an hour, or longer with a Deeper hopper).',
  },
  {
    title: 'Grow',
    body: `Spend spare coins on perks and coupons. When your room is full, check out: it trades your items for stamps, each a permanent +${STAMP_BONUS * 100}% income.`,
  },
];

function GuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const seenGuide = useGameSelector((state) => state.seenGuide);
  const firstVisit = useGameSelector((state) => !state.seenGuide && state.awayEarnings === null && state.lastReceipt === null);
  const { dispatch } = useGame();

  const close = () => {
    if (!seenGuide) dispatch({ type: 'closeGuide' });
    onClose();
  };

  return (
    <Sheet open={open || firstVisit} onClose={close} title='How to play' placement='center' closeLabel='Close how to play'>
      <ol className='guide'>
        {STEPS.map((step, index) => (
          <li key={step.title} className='guide__step'>
            <span className='guide__number' aria-hidden='true'>
              {index + 1}
            </span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <button type='button' className='chunky chunky--primary guide__start' onClick={close}>
        Let’s shop
      </button>
    </Sheet>
  );
}

export default GuideSheet;
