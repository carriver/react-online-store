import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

import Landing from './pages/Landing';

const Store = lazy(() => import('./pages/Store'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/store/*' element={<Store />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
