import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AccessDenied = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleReturn = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>Your account is blocked or you do not have permission to use this app.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleReturn}>
            Return to sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
