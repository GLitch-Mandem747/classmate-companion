import { useState } from 'react';
import { SplashScreen } from '@/components/SplashScreen';
import { GradingSystemSelection } from '@/components/GradingSystemSelection';
import { SeniorDashboard } from '@/components/SeniorDashboard';
import JuniorIndex from '@/pages/JuniorIndex';

type AppState = 'splash' | 'selection' | 'senior' | 'junior';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('splash');

  const handleSplashComplete = () => {
    setAppState('selection');
  };

  const handleSystemSelect = (system: 'junior' | 'senior') => {
    setAppState(system);
  };

  const handleBackToSelection = () => {
    setAppState('selection');
  };

  if (appState === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (appState === 'selection') {
    return <GradingSystemSelection onSelectSystem={handleSystemSelect} />;
  }

  if (appState === 'junior') {
    return <JuniorIndex onBack={handleBackToSelection} />;
  }

  return <SeniorDashboard onBack={handleBackToSelection} />;
};

export default Index;
