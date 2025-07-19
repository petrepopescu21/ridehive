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

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>({ view: 'login' });

  // Update app state based on authentication
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && appState.view === 'login') {
        setAppState({ view: 'dashboard' });
      } else if (!isAuthenticated && appState.view !== 'login') {
        setAppState({ view: 'login' });
      }
    }
  }, [isAuthenticated, loading, appState.view]);

  if (loading) {
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
    return (
      <Login 
        onLoginSuccess={() => setAppState({ view: 'dashboard' })} 
      />
    );
  }

  switch (appState.view) {
    case 'dashboard':
      return (
        <Dashboard
          onCreateMap={() => setAppState({ view: 'map-editor' })}
          onEditMap={(mapId) => setAppState({ view: 'map-editor', mapId })}
          onStartRide={(rideId) => setAppState({ view: 'active-ride', rideId })}
        />
      );
    
    case 'map-editor':
      return (
        <MapEditorPage
          mapId={appState.mapId}
          onBack={() => setAppState({ view: 'dashboard' })}
        />
      );
    
    case 'active-ride':
      return (
        <ActiveRide
          rideId={appState.rideId}
          onEndRide={() => setAppState({ view: 'dashboard' })}
        />
      );
    
    default:
      return (
        <Dashboard
          onCreateMap={() => setAppState({ view: 'map-editor' })}
          onEditMap={(mapId) => setAppState({ view: 'map-editor', mapId })}
          onStartRide={(rideId) => setAppState({ view: 'active-ride', rideId })}
        />
      );
  }
}

export default App;
