import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CampusMap    from './campus-map/CampusMap';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"    element={<LandingPage />} />
        <Route path="/map" element={<CampusMap />} />
      </Routes>
    </BrowserRouter>
  );
}
