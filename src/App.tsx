import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { AnimatePresence, motion } from 'motion/react';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Register = lazy(() => import('./pages/Register'));
const Donors = lazy(() => import('./pages/Donors'));
const Emergency = lazy(() => import('./pages/Emergency'));
const About = lazy(() => import('./pages/About'));
const DonorProfile = lazy(() => import('./pages/DonorProfile'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const Groups = lazy(() => import('./pages/Groups'));
const GroupDetails = lazy(() => import('./pages/GroupDetails'));

import { LanguageProvider } from './contexts/LanguageContext';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname}>
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes location={location}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
            <Route path="/donors" element={<PageWrapper><Donors /></PageWrapper>} />
            <Route path="/emergency" element={<PageWrapper><Emergency /></PageWrapper>} />
            <Route path="/groups" element={<PageWrapper><Groups /></PageWrapper>} />
            <Route path="/groups/:id" element={<PageWrapper><GroupDetails /></PageWrapper>} />
            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/donor/:id" element={<PageWrapper><DonorProfile /></PageWrapper>} />
            <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  return (
    <LanguageProvider>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
      <Router>
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </Router>
    </LanguageProvider>
  );
}
