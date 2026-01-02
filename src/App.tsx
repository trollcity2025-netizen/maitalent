import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MISSING_ENV_KEYS } from './lib/supabaseClient';
import EnvironmentError from './Components/EnvironmentError';
import Home from './Pages/Home';
import CoinStore from './Pages/CoinStore';
import Apply from './Pages/Apply';
import HowItWorks from './Pages/HowItWorks';
import Profile from './Pages/Profile';
import AdminDashboard from './Pages/AdminDashboard';
import Leaderboard from './Pages/Leaderboard';
import JudgeApplication from './Pages/JudgeApplication';
import Messages from './Pages/Messages';
import ContestantProfile from './Pages/ContestantProfile';
import Auth from './Pages/Auth';
import Audition from './Pages/Audition';

function App() {
  // Check for missing environment variables and render error screen if any are missing
  if (MISSING_ENV_KEYS.length > 0) {
    return <EnvironmentError missingKeys={MISSING_ENV_KEYS} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/coin-store" element={<CoinStore />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/judge-application" element={<JudgeApplication />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/contestant/:id" element={<ContestantProfile />} />
        <Route path="/audition" element={<Audition />} />
        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
