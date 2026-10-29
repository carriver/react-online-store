import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

import { loadGame, saveGame } from './persistence';
import { play, type Cue } from './sound';
import { gameReducer, type GameAction, type GameState } from './state';

const TICK_MS = 250;
const SAVE_MS = 3000;

// Coins change on every tick, so they ride the timed save; anything bought or chosen saves at once.
const SAVE_RIGHT_AWAY: (keyof GameState)[] = [
  'cart',
  'perks',
  'appliedCoupon',
  'ownedThemes',
  'theme',
  'stamps',
  'awayEarnings',
  'mode',
  'muted',
  'seenGuide',
];

export type Pop = { id: number; text: string; x: number; y: number; tone: 'coin' | 'info' };

type GameStore = {
  getState: () => GameState;
  dispatch: (action: GameAction) => void;
  subscribe: (listener: () => void) => () => void;
};

// A plain external store instead of context state: the clock ticks four times a second,
// and only components whose selected slice changed should re-render.
export const createGameStore = (initialState: GameState): GameStore => {
  let state = initialState;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch: (action) => {
      const next = gameReducer(state, action);
      if (next === state) return;
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

type GameContextValue = {
  store: GameStore;
  sfx: (cue: Cue) => void;
  pop: (text: string, at: { x: number; y: number }, tone?: Pop['tone']) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

const useGameContext = () => {
  const value = useContext(GameContext);
  if (!value) throw new Error('Game hooks must be used inside <GameProvider>');
  return value;
};

export const useGameSelector = <T,>(selector: (state: GameState) => T): T => {
  const { store } = useGameContext();
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
};

export const useGame = () => {
  const { store, sfx, pop } = useGameContext();
  return { dispatch: store.dispatch, getState: store.getState, sfx, pop };
};

export const centerOf = (element: Element) => {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 3 };
};

function PopLayer({ pops }: { pops: Pop[] }) {
  return (
    <div className='pop-layer' aria-hidden='true'>
      {pops.map((pop) => (
        <span key={pop.id} className={`pop pop--${pop.tone}`} style={{ left: pop.x, top: pop.y }}>
          {pop.text}
        </span>
      ))}
    </div>
  );
}

export function GameProvider({ children, now = Date.now }: { children: ReactNode; now?: () => number }) {
  const [store] = useState(() => createGameStore(loadGame(now())));
  const [pops, setPops] = useState<Pop[]>([]);
  const nextPopId = useRef(0);

  useEffect(() => {
    const tick = () => document.visibilityState === 'visible' && store.dispatch({ type: 'tick', now: now() });
    const ticker = window.setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(ticker);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [store, now]);

  useEffect(() => {
    const persist = () => saveGame(store.getState());
    const saver = window.setInterval(persist, SAVE_MS);
    let previous = store.getState();
    const unsubscribe = store.subscribe(() => {
      const current = store.getState();
      if (SAVE_RIGHT_AWAY.some((key) => current[key] !== previous[key])) persist();
      previous = current;
    });
    const persistWhenHidden = () => document.visibilityState === 'hidden' && persist();
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', persistWhenHidden);
    return () => {
      window.clearInterval(saver);
      unsubscribe();
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', persistWhenHidden);
      persist();
    };
  }, [store]);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.dataset.theme = store.getState().theme;
    };
    applyTheme();
    return store.subscribe(applyTheme);
  }, [store]);

  const sfx = useCallback((cue: Cue) => {
    if (!store.getState().muted) play(cue);
  }, [store]);

  const pop = useCallback((text: string, at: { x: number; y: number }, tone: Pop['tone'] = 'coin') => {
    const id = nextPopId.current++;
    setPops((current) => [...current.slice(-12), { id, text, x: at.x, y: at.y, tone }]);
    window.setTimeout(() => setPops((current) => current.filter((entry) => entry.id !== id)), 1100);
  }, []);

  const value = useMemo<GameContextValue>(() => ({ store, sfx, pop }), [store, sfx, pop]);

  return (
    <GameContext.Provider value={value}>
      {children}
      <PopLayer pops={pops} />
    </GameContext.Provider>
  );
}
