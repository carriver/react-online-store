import { lazy, Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { productsQuery } from '../api';
import CartSheet from '../components/CartSheet';
import GuideSheet from '../components/GuideSheet';
import Hud from '../components/Hud';
import PerksSheet from '../components/PerksSheet';
import ReceiptSheet from '../components/ReceiptSheet';
import WelcomeBack from '../components/WelcomeBack';
import { GameProvider, useGame, useGameSelector } from '../game/GameProvider';
import './Store.css';

const loadRoom = () => import('../room/RoomMode');
const loadMachine = () => import('../machine/MachineMode');
const RoomMode = lazy(loadRoom);
const MachineMode = lazy(loadMachine);

function StockingShelves() {
  return (
    <div className='stocking' role='status'>
      <span className='stocking__boxes' aria-hidden='true'>
        <i />
        <i />
        <i />
      </span>
      Stocking the shelves…
    </div>
  );
}

function useModeFromLink() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { dispatch } = useGame();
  const requested = searchParams.get('mode');

  useEffect(() => {
    if (requested !== 'room' && requested !== 'machine') return;
    dispatch({ type: 'setMode', mode: requested });
    setSearchParams({}, { replace: true });
  }, [requested, dispatch, setSearchParams]);
}

function StoreFloor() {
  const { data: products, isPending, error } = useQuery(productsQuery);
  const mode = useGameSelector((state) => state.mode);
  const [cartOpen, setCartOpen] = useState(false);
  const [perksOpen, setPerksOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  useModeFromLink();

  useEffect(() => {
    // Warm the other mode in the background so the toggle switches instantly.
    const warm = () => void (mode === 'room' ? loadMachine() : loadRoom());
    const idle = window.requestIdleCallback?.(warm) ?? window.setTimeout(warm, 1500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle));
  }, [mode]);

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  const openPerks = () => {
    setCartOpen(false);
    setPerksOpen(true);
  };

  return (
    <div className='store'>
      <a className='skip-link' href='#store-main'>
        Skip to the store
      </a>
      <Hud onOpenCart={() => setCartOpen(true)} onOpenPerks={openPerks} onOpenGuide={() => setGuideOpen(true)} />
      <main id='store-main' className='store__main'>
        {isPending ? (
          <StockingShelves />
        ) : error || !products ? (
          <div role='alert' className='store__error'>
            Something went wrong loading the products. Please try again later.
          </div>
        ) : (
          <Suspense fallback={<StockingShelves />}>
            <div key={mode} className='store__mode'>
              {mode === 'room' ? <RoomMode products={products} /> : <MachineMode products={products} onOpenCart={() => setCartOpen(true)} />}
            </div>
          </Suspense>
        )}
      </main>
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} onOpenPerks={openPerks} />
      <PerksSheet open={perksOpen} onClose={() => setPerksOpen(false)} />
      <ReceiptSheet />
      <WelcomeBack />
      <GuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function Store() {
  return (
    <GameProvider>
      <StoreFloor />
    </GameProvider>
  );
}

export default Store;
