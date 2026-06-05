import { useState, useRef, useCallback } from 'react';

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
  const [currency, setCurrency] = useState('USD');
  const [voiceInitMsg, setVoiceInitMsg] = useState('');

  const toastTimer = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

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
  const showVoicePage = (initMsg) => { setVoiceInitMsg(initMsg || ''); setPage('voice'); scrollTop(); };
  const showAbout = () => { setPage('about'); scrollTop(); };
  const showContact = () => { setPage('contact'); scrollTop(); };

  const openAuth = (mode) => setAuthMode(mode);
  const closeAuth = () => setAuthMode(null);
  const submitAuth = (name, email) => {
    setUser({ name, email });
    setAuthMode(null);
    toast('Signed in as ' + name);
  };

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

  const navFns = { showExplore, showPlanner, showExperience, showVoicePage, showAbout, showContact };

  return (
    <>
      <Nav {...navFns} user={user} openAuth={openAuth} currency={currency} setCurrency={setCurrency} />

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
          currency={currency}
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
          currency={currency}
        />
      )}

      {page === 'experience' && (
        <ExperiencePage toast={toast} />
      )}

      {page === 'voice' && (
        <VoicePage
          openPlanner={openPlanner}
          showExplore={showExplore}
          toast={toast}
          currency={currency}
          initialMessage={voiceInitMsg}
        />
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
          onSubmit={submitAuth}
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
