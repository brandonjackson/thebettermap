import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Town from './pages/Town';
import FindImprovements from './pages/FindImprovements';
import SubmitOpportunity from './pages/SubmitOpportunity';
import OpportunityDetail from './pages/OpportunityDetail';
import ImagineNew from './pages/ImagineNew';
import VisionDetail from './pages/VisionDetail';
import Celebrate from './pages/Celebrate';
import SubmitCelebration from './pages/SubmitCelebration';
import CelebrationDetail from './pages/CelebrationDetail';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/town/:slug" element={<Town />} />
          <Route path="/town/:slug/improve" element={<FindImprovements />} />
          <Route path="/town/:slug/improve/submit" element={<SubmitOpportunity />} />
          <Route path="/town/:slug/improve/:id" element={<OpportunityDetail />} />
          <Route path="/town/:slug/imagine" element={<ImagineNew />} />
          <Route path="/town/:slug/imagine/:id" element={<VisionDetail />} />
          <Route path="/town/:slug/celebrate" element={<Celebrate />} />
          <Route path="/town/:slug/celebrate/submit" element={<SubmitCelebration />} />
          <Route path="/town/:slug/celebrate/:id" element={<CelebrationDetail />} />
        </Routes>
      </main>
    </div>
  );
}
