import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplashScreen } from '@/components/SplashScreen';
import { GradingSystemSelection } from '@/components/GradingSystemSelection';
import { SeniorDashboard } from '@/components/SeniorDashboard';
import JuniorIndex from '@/pages/JuniorIndex';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

type AppState = 'splash' | 'selection' | 'senior' | 'junior';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const navigate = useNavigate();

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
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <Button onClick={() => navigate('/auth')} variant="outline">
            <LogIn className="h-4 w-4 mr-2" />
            Teacher Login
          </Button>
        </div>
        <GradingSystemSelection onSelectSystem={handleSystemSelect} />
      </div>
    );
  }

  if (appState === 'junior') {
    return <JuniorIndex onBack={handleBackToSelection} />;
  }

  return <SeniorDashboard onBack={handleBackToSelection} />;
};

export default Index;
