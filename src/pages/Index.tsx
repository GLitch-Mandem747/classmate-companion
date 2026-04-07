import { useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { SeniorDashboard } from '@/components/SeniorDashboard';

type AppState = 'splash' | 'dashboard';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('splash');

  if (appState === 'splash') {
    return <SplashScreen onComplete={() => setAppState('dashboard')} />;
  }

  return <SeniorDashboard />;
};

export default Index;
