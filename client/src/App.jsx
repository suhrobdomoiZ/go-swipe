import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthGate from './components/AuthGate';
import SwipeScreen from './screens/SwipeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DetailsScreen from './screens/DetailsScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import CreateEventScreen from './screens/CreateEventScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyEventsScreen from './screens/MyEventsScreen';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route path="/" element={<SwipeScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/event/:id" element={<DetailsScreen />} />
          <Route path="/favorites" element={<FavoritesScreen />} />
          <Route path="/create" element={<CreateEventScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/my" element={<MyEventsScreen />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
