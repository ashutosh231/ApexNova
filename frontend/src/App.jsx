import React, { useEffect, useState } from 'react';
import CustomCursor from './components/CustomCursor.jsx';
import { Routes, Route } from 'react-router-dom';
import './index.css';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CompanyCarousel from './components/CompanyCarousel';
import Tournaments from './components/Tournaments';
import TestimonialsSlider from './components/TestimonialsSlider';
import Features from './components/Features';
import Stats from './components/Stats';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Contact from './components/Contact';
import Footer from './components/Footer';
import VideoBackground from './components/VideoBackground.jsx';
import Signup from './components/Signup.jsx';
import Signin from './components/Signin.jsx';
import TournamentsPage from './pages/TournamentsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MatchRoomPage from './pages/MatchRoomPage.jsx';
import MemoryMatchRoomPage from './pages/MemoryMatchRoomPage.jsx';
import LobbyPage from './pages/LobbyPage.jsx';
import MemoryLobbyPage from './pages/MemoryLobbyPage.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ScrollToTopButton from './components/ScrollToTopButton.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { MatchProvider } from './context/MatchContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useSearchParams } from 'react-router-dom';
import GlobalInviteListener from './components/GlobalInviteListener.jsx';

/* ─── Homepage shell ─────────────────────────────────── */
const HomePage = ({ onGetStarted, onSignIn }) => {

  return (
    <div className="app-bg">
      <VideoBackground />
      <div className="bg-grid" />
      <div className="bg-noise" />

      <div className="viewport-chrome">
        <div className="floating-shell">
          <div className="shell-glow" aria-hidden />
          <div className="shell-grid" aria-hidden />
          <div className="shell-noise" aria-hidden />

          <div className="app-content">
            <Navbar onGetStarted={onGetStarted} onSignIn={onSignIn} />
            <Hero />

            <div className="divider" />

            <CompanyCarousel />

            <div className="divider" />

            <Tournaments />

            <div className="divider" />

            <TestimonialsSlider />

            <div className="divider" />

            <Features />

            <div className="divider" />

            <Stats />

            <div className="divider" />

            <Testimonials />

            <div className="divider" />

            <CTA />

            <div className="divider" />

            <Contact />

            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Root App with routing ──────────────────────────── */
const AppContent = () => {
  const [signupOpen, setSignupOpen] = useState(false);
  const [signinOpen, setSigninOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Intercept protective redirects
    if (searchParams.get('requiresLogin') === 'true') {
      setSigninOpen(true);
      // Clean up the URL quietly without navigation event
      searchParams.delete('requiresLogin');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <GlobalInviteListener />
      <CustomCursor />
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onGetStarted={() => setSignupOpen(true)}
              onSignIn={() => setSigninOpen(true)}
            />
          }
        />
        <Route path="/tournaments" element={
          <ProtectedRoute>
            <TournamentsPage />
          </ProtectedRoute>
        } />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/match" element={
          <ProtectedRoute>
            <MatchRoomPage />
          </ProtectedRoute>
        } />
        <Route path="/match-room" element={
          <ProtectedRoute>
            <MatchRoomPage />
          </ProtectedRoute>
        } />
        <Route path="/lobby" element={
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        } />
        <Route path="/memory-match-room" element={
          <ProtectedRoute>
            <MemoryMatchRoomPage />
          </ProtectedRoute>
        } />
        <Route path="/memory-lobby" element={
          <ProtectedRoute>
            <MemoryLobbyPage />
          </ProtectedRoute>
        } />
      </Routes>

      <Signup isOpen={signupOpen} onClose={() => setSignupOpen(false)} onSwitchToSignin={() => { setSignupOpen(false); setTimeout(() => setSigninOpen(true), 200); }} />
      <Signin
        isOpen={signinOpen}
        onClose={() => setSigninOpen(false)}
        onSwitchToSignup={() => { setSigninOpen(false); setTimeout(() => setSignupOpen(true), 200); }}
      />
      <ScrollToTopButton />
    </>
  );
};

const App = () => (
  <AuthProvider>
    <MatchProvider>
      <AppContent />
    </MatchProvider>
  </AuthProvider>
);

export default App;