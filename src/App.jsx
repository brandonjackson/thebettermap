import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Vision from './pages/Vision';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/vision" element={<Vision />} />
            <Route path="/town/:slug" element={<Town />} />
            <Route path="/town/:slug/improve" element={<FindImprovements />} />
            <Route path="/town/:slug/improve/submit" element={<RequireAuth><SubmitOpportunity /></RequireAuth>} />
            <Route path="/town/:slug/improve/:id" element={<OpportunityDetail />} />
            <Route path="/town/:slug/imagine" element={<ImagineNew />} />
            <Route path="/town/:slug/imagine/:id" element={<VisionDetail />} />
            <Route path="/town/:slug/celebrate" element={<Celebrate />} />
            <Route path="/town/:slug/celebrate/submit" element={<RequireAuth><SubmitCelebration /></RequireAuth>} />
            <Route path="/town/:slug/celebrate/:id" element={<CelebrationDetail />} />
            <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
