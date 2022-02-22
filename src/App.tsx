import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Store from './pages/Store';

function App() {
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<Landing />} />
      <Route path='/store*' element={<Store />} />
    </Routes>
  </BrowserRouter>;
}

export default App;
