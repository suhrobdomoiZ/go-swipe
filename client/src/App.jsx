import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import AuthGate from './components/AuthGate';
import ErrorBoundary from './components/ErrorBoundary';
import SwipeScreen from './screens/SwipeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DetailsScreen from './screens/DetailsScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import CreateEventScreen from './screens/CreateEventScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyEventsScreen from './screens/MyEventsScreen';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route path="/" element={<SwipeScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/event/:id" element={<DetailsScreen />} />
            <Route path="/favorites" element={<FavoritesScreen />} />
            <Route path="/create" element={<CreateEventScreen />} />
            <Route path="/event/:id/edit" element={<CreateEventScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/my" element={<MyEventsScreen />} />
            {/* MAX может открыть приложение по любому пути; без этого Routes рисует пустоту, а не экран. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
