import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Store from './pages/Store';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Store />} />
        <Route path='/landing/*' element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
