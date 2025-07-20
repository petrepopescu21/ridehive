import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MapEditorPage } from './pages/MapEditor';
import { ActiveRide } from './pages/ActiveRide';
import { useAuth } from './hooks/useAuth';

type AppState = 
  | { view: 'login' }
  | { view: 'dashboard' }
  | { view: 'map-editor'; mapId?: number }
  | { view: 'active-ride'; rideId: number };

// Parse URL to determine initial state
const getInitialStateFromURL = (): AppState => {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  
  if (path === '/map-editor') {
    const mapId = params.get('mapId');
    return { view: 'map-editor', mapId: mapId ? parseInt(mapId) : undefined };
  } else if (path === '/active-ride') {
    const rideId = params.get('rideId');
    return rideId ? { view: 'active-ride', rideId: parseInt(rideId) } : { view: 'dashboard' };
  } else if (path === '/dashboard') {
    return { view: 'dashboard' };
  }
  
  return { view: 'login' };
};

// Update URL based on app state
const updateURL = (state: AppState) => {
  let path = '/';
  let search = '';
  
  switch (state.view) {
    case 'dashboard':
      path = '/dashboard';
      break;
    case 'map-editor':
      path = '/map-editor';
      if (state.mapId) {
        search = `?mapId=${state.mapId}`;
      }
      break;
    case 'active-ride':
      path = '/active-ride';
      search = `?rideId=${state.rideId}`;
      break;
    case 'login':
      path = '/';
      break;
  }
  
  const newURL = path + search;
  if (window.location.pathname + window.location.search !== newURL) {
    window.history.pushState(null, '', newURL);
  }
};

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>(() => getInitialStateFromURL());

  console.log('🔄 App render - Auth state:', { isAuthenticated, loading, view: appState.view });

  // Navigation function that updates both state and URL
  const navigateToState = (newState: AppState) => {
    setAppState(newState);
    updateURL(newState);
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newState = getInitialStateFromURL();
      setAppState(newState);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when app state changes
  useEffect(() => {
    updateURL(appState);
  }, [appState]);

  // Update app state based on authentication
  useEffect(() => {
    console.log('🔄 Auth effect triggered:', { isAuthenticated, loading, currentView: appState.view });
    if (!loading) {
      if (isAuthenticated && appState.view === 'login') {
        console.log('✅ User authenticated, switching to dashboard');
        navigateToState({ view: 'dashboard' });
      } else if (!isAuthenticated && appState.view !== 'login') {
        console.log('❌ User not authenticated, switching to login');
        navigateToState({ view: 'login' });
      }
    }
  }, [isAuthenticated, loading, appState.view]);

  if (loading) {
    console.log('🔄 Rendering loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔐 Rendering login page');
    return (
      <Login 
        onLoginSuccess={() => navigateToState({ view: 'dashboard' })} 
      />
    );
  }

  switch (appState.view) {
    case 'dashboard':
      console.log('📊 Rendering dashboard');
      return (
        <Dashboard
          onCreateMap={() => navigateToState({ view: 'map-editor' })}
          onEditMap={(mapId) => navigateToState({ view: 'map-editor', mapId })}
          onStartRide={(rideId) => navigateToState({ view: 'active-ride', rideId })}
        />
      );
    
    case 'map-editor':
      console.log('🗺️ Rendering map editor');
      return (
        <MapEditorPage
          mapId={appState.mapId}
          onBack={() => navigateToState({ view: 'dashboard' })}
        />
      );
    
    case 'active-ride':
      console.log('🚗 Rendering active ride');
      return (
        <ActiveRide
          rideId={appState.rideId}
          onEndRide={() => navigateToState({ view: 'dashboard' })}
        />
      );
    
    default:
      console.log('📊 Rendering default dashboard');
      return (
        <Dashboard
          onCreateMap={() => navigateToState({ view: 'map-editor' })}
          onEditMap={(mapId) => navigateToState({ view: 'map-editor', mapId })}
          onStartRide={(rideId) => navigateToState({ view: 'active-ride', rideId })}
        />
      );
  }
}

export default App;
