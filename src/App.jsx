import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LibraryExplorer from './pages/LibraryExplorer';
import AdminPage from './pages/AdminPage';
import { CampusMap3DRoute } from './CampusMap3DRoute';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/library" element={<LibraryExplorer />} />
        <Route path="/admin"   element={<AdminPage />} />
        <Route path="/map" element={<CampusMap3DRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

