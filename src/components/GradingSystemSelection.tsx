import { Button } from '@/components/ui/button';

interface GradingSystemSelectionProps {
  onSelectSenior: () => void;
  onSelectJunior: () => void;
}

export const GradingSystemSelection = ({ onSelectSenior, onSelectJunior }: GradingSystemSelectionProps) => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-12">
        Choose Grading System
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-6">
        <Button
          onClick={onSelectJunior}
          className="min-w-[200px] h-14 text-lg bg-green-700 hover:bg-green-800 text-white"
        >
          Junior Grading System
        </Button>
        
        <Button
          onClick={onSelectSenior}
          className="min-w-[200px] h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Senior Grading System
        </Button>
      </div>
      
      <div className="absolute bottom-6 text-center">
        <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground">SOFTWAREARMY</p>
      </div>
    </div>
  );
};
