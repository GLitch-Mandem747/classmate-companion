import { useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { GradingSystemSelection } from '@/components/GradingSystemSelection';
import { SeniorDashboard } from '@/components/SeniorDashboard';
import JuniorIndex from '@/pages/JuniorIndex';

type AppState = 'splash' | 'selection' | 'senior' | 'junior';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('splash');

  if (appState === 'splash') {
    return <SplashScreen onComplete={() => setAppState('selection')} />;
  }

  if (appState === 'selection') {
    return (
      <GradingSystemSelection
        onSelectSenior={() => setAppState('senior')}
        onSelectJunior={() => setAppState('junior')}
      />
    );
  }

  if (appState === 'junior') {
    return <JuniorIndex onBack={() => setAppState('selection')} />;
  }

  return <SeniorDashboard onBack={() => setAppState('selection')} />;
};

export default Index;
