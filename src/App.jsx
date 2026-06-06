import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from './supabase.js';

import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
import AuthModal from './components/AuthModal.jsx';
import VoiceAssist from './components/VoiceAssist.jsx';

import ExplorePage from './pages/ExplorePage.jsx';
import CityPage from './pages/CityPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import ExperiencePage from './pages/ExperiencePage.jsx';
import VoicePage from './pages/VoicePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import AdventurePage from './pages/AdventurePage.jsx';

export default function App() {
  const [page, setPage] = useState('explore');
  const [cityName, setCityName] = useState('');
  const [trip, setTrip] = useState([]);
  const [tripTier, setTripTier] = useState('Mid-range');
  const [user, setUser] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [authMode, setAuthMode] = useState(null);
  const [assistOpen, setAssistOpen] = useState(false);

  const [plannerCity, setPlannerCity] = useState('Dubai');
  const [plannerTier, setPlannerTier] = useState('Mid-range');
  const [plannerPax, setPlannerPax] = useState(2);
  const [plannerSelections, setPlannerSelections] = useState([]);

  const toastTimer = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || 'Traveller',
          email: session.user.email
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || 'Traveller',
          email: session.user.email
        });
        toast('Signed in as ' + (session.user.user_metadata.name || 'Traveller'));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast('Signed out');
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const showExplore = () => { setPage('explore'); scrollTop(); };
  const openCity = (name) => { setCityName(name); setTrip([]); setTripTier('Mid-range'); setPage('city'); scrollTop(); };
  const showPlanner = () => { setPlannerSelections([]); setPage('planner'); scrollTop(); };
  const openPlanner = (city, selections, tier) => {
    setPlannerCity(city);
    setPlannerSelections(selections || []);
    setPlannerTier(tier || 'Mid-range');
    setPage('planner');
    scrollTop();
  };
  const showExperience = () => { setPage('experience'); scrollTop(); };
  const showVoicePage = () => { setPage('voice'); scrollTop(); };
  const showAdventure = () => { setPage('adventure'); scrollTop(); };
  const showAbout = () => { setPage('about'); scrollTop(); };
  const showContact = () => { setPage('contact'); scrollTop(); };

  const openAuth = (mode) => setAuthMode(mode);
  const closeAuth = () => setAuthMode(null);

  const onToggleAct = (title) => {
    setTrip((prev) =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };
  const onRemoveTrip = (title) => {
    setTrip((prev) => prev.filter(t => t !== title));
  };
  const onPlanTrip = (city, selections, tier) => {
    openPlanner(city, selections, tier);
  };

  const navFns = { showExplore, showPlanner, showExperience, showVoicePage, showAdventure, showAbout, showContact };

  return (
    <>
      <Nav {...navFns} user={user} openAuth={openAuth} logout={logout} />

      {page === 'explore' && (
        <ExplorePage
          openCity={openCity}
          showPlanner={showPlanner}
          showVoicePage={showVoicePage}
          toast={toast}
        />
      )}

      {page === 'city' && (
        <CityPage
          cityName={cityName}
          trip={trip}
          tripTier={tripTier}
          onTierChange={setTripTier}
          onToggleAct={onToggleAct}
          onRemoveTrip={onRemoveTrip}
          onPlanTrip={onPlanTrip}
          showExplore={showExplore}
          toast={toast}
        />
      )}

      {page === 'planner' && (
        <PlannerPage
          plannerCity={plannerCity}
          plannerTier={plannerTier}
          plannerPax={plannerPax}
          plannerSelections={plannerSelections}
          setPlannerCity={setPlannerCity}
          setPlannerTier={setPlannerTier}
          setPlannerPax={setPlannerPax}
          showExplore={showExplore}
          toast={toast}
          user={user}
        />
      )}

      {page === 'experience' && (
        <ExperiencePage toast={toast} user={user} showExplore={showExplore} />
      )}

      {page === 'voice' && (
        <VoicePage
          openPlanner={openPlanner}
          showExplore={showExplore}
          toast={toast}
          user={user}
        />
      )}

      {page === 'adventure' && (
        <AdventurePage toast={toast} user={user} />
      )}

      {page === 'about' && (
        <AboutPage showContact={showContact} />
      )}

      {page === 'contact' && (
        <ContactPage toast={toast} />
      )}

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={closeAuth}
          onSwap={(m) => setAuthMode(m)}
        />
      )}

      <VoiceAssist
        open={assistOpen}
        onToggle={() => setAssistOpen(o => !o)}
        showPlanner={showPlanner}
        showExperience={showExperience}
        showVoicePage={showVoicePage}
      />

      <Footer {...navFns} />

      <Toast msg={toastMsg} />
    </>
  );
}
