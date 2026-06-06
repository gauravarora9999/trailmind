import { useState, useRef, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './supabase.js';

import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
import AuthModal from './components/AuthModal.jsx';
import VoiceAssist from './components/VoiceAssist.jsx';

import ExplorePage from './pages/ExplorePage.jsx';
import CityPage from './pages/CityPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import MyTripsPage from './pages/MyTripsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

export default function App() {
  const navigate = useNavigate();
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

  const showExplore = () => { navigate('/'); scrollTop(); };
  const openCity = (name) => { setCityName(name); setTrip([]); setTripTier('Mid-range'); navigate('/city/' + encodeURIComponent(name)); scrollTop(); };
  const showPlanner = () => { setPlannerSelections([]); navigate('/planner'); scrollTop(); };
  const openPlanner = (city, selections, tier) => {
    setPlannerCity(city);
    setPlannerSelections(selections || []);
    setPlannerTier(tier || 'Mid-range');
    navigate('/planner');
    scrollTop();
  };
  const showAbout = () => { navigate('/about'); scrollTop(); };
  const showContact = () => { navigate('/contact'); scrollTop(); };
  const showMyTrips = () => { navigate('/my-trips'); scrollTop(); };

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

  return (
    <>
      <Nav
        showExplore={showExplore}
        showPlanner={showPlanner}
        showAbout={showAbout}
        showMyTrips={showMyTrips}
        user={user}
        openAuth={openAuth}
        logout={logout}
      />

      <Routes>
        <Route path="/" element={
          <ExplorePage
            openCity={openCity}
            showPlanner={showPlanner}
            toast={toast}
          />
        } />
        <Route path="/city/:name" element={
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
        } />
        <Route path="/planner" element={
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
        } />
        <Route path="/my-trips" element={
          <MyTripsPage
            user={user}
            toast={toast}
            showExplore={showExplore}
            openPlanner={openPlanner}
          />
        } />
        <Route path="/about" element={
          <AboutPage showContact={showContact} />
        } />
        <Route path="/contact" element={
          <ContactPage toast={toast} />
        } />
      </Routes>

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
      />

      <Footer
        showExplore={showExplore}
        showPlanner={showPlanner}
        showAbout={showAbout}
        showContact={showContact}
      />

      <Toast msg={toastMsg} />
    </>
  );
}
