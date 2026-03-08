import { useEffect, useState } from 'react';
import schoolLogo from '@/assets/school-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo and School Name - Centered */}
      <div className="flex flex-col items-center">
        <img 
          src={schoolLogo} 
          alt="St. Dominic's Boys Secondary School Logo" 
          className="w-32 h-32 md:w-40 md:h-40 object-contain mb-4"
          style={{ filter: 'invert(1) grayscale(1) contrast(1.5)' }}
        />
        <h1 className="text-2xl md:text-4xl font-bold text-primary tracking-wide text-center px-4">
          ST. DOMINIC'S BOYS SECONDARY SCHOOL
        </h1>
      </div>

      {/* Company Credit - Bottom */}
      <p className="absolute bottom-8 text-muted-foreground text-sm tracking-widest">
        KLASSIC CODE SOFTWARE COMPANY
      </p>
    </div>
  );
};
