import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, LogOut, Shield, UserX, UserCheck } from 'lucide-react';

interface AccessUserRow {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();

  const {
    user,
    accessProfile,
    accessProfileLoading,
    signOut,
    loading: authLoading
  } = useAuth();

  const [users, setUsers] = useState<AccessUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || accessProfileLoading) {
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    if (!accessProfile) {
      navigate('/access-denied');
      return;
    }

    if (accessProfile.role !== 'admin') {
      navigate('/access-denied');
      return;
    }

    if (!accessProfile.is_active) {
      navigate('/access-denied');
      return;
    }

  }, [
    authLoading,
    accessProfileLoading,
    user,
    accessProfile,
    navigate
  ]);

  useEffect(() => {
    if (
      !authLoading &&
      !accessProfileLoading &&
      user &&
      accessProfile?.role === 'admin' &&
      accessProfile.is_active
    ) {
      fetchUsers();
    }
  }, [
    authLoading,
    accessProfileLoading,
    user,
    accessProfile
  ]);

  const fetchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('user_access')
      .select('*')
      .order('email', { ascending: true });

    if (error) {
      console.error('Failed to load users:', error);

      toast({
        title: 'Error',
        description: 'Failed to load user list',
        variant: 'destructive'
      });

    } else {
      setUsers(
        (data || []) as AccessUserRow[]
      );
    }

    setLoading(false);
  };

  const toggleUserAccess = async (
    targetUser: AccessUserRow
  ) => {

    setUpdatingId(targetUser.id);

    const { error } = await supabase
      .from('user_access')
      .update({
        is_active: !targetUser.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUser.id);

    setUpdatingId(null);

    if (error) {

      console.error(
        'Failed to update access status:',
        error
      );

      toast({
        title: 'Error',
        description: 'Failed to update user access',
        variant: 'destructive'
      });

      return;
    }

    toast({
      title: 'Access updated',
      description:
        `${targetUser.email} has been ${
          !targetUser.is_active
            ? 'unblocked'
            : 'blocked'
        }.`,
    });

    await fetchUsers();
  };

  const handleSignOut = async () => {

    await signOut();

    navigate('/auth');

  };

  if (
    authLoading ||
    accessProfileLoading ||
    loading
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (
    !user ||
    !accessProfile ||
    accessProfile.role !== 'admin' ||
    !accessProfile.is_active
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">

      <header className="border-b border-border bg-card">

        <div className="container mx-auto px-4 py-4 flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-primary">
              Admin Dashboard
            </h1>

            <p className="text-sm text-muted-foreground">
              Manage access for all users
            </p>

          </div>

          <div className="flex items-center gap-3">

            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
            >

              <LogOut className="h-4 w-4 mr-2" />

              Sign Out

            </Button>

          </div>

        </div>

      </header>


      <main className="container mx-auto px-4 py-8">

        <div className="grid gap-4 md:grid-cols-2">

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">

                <Shield className="h-5 w-5 text-primary" />

                Admin Controls

              </CardTitle>

              <CardDescription>
                View users and update account access in one place.
              </CardDescription>

            </CardHeader>

            <CardContent>

              <p className="text-sm text-muted-foreground">
                Only the configured admin email can manage the user access table.
              </p>

            </CardContent>

          </Card>


          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">

                <UserCheck className="h-5 w-5 text-primary" />

                Access Overview

              </CardTitle>

              <CardDescription>
                {users.length} users found in the registry.
              </CardDescription>

            </CardHeader>

            <CardContent>

              <div className="flex flex-wrap gap-2">

                <Badge variant="secondary">
                  Active: {
                    users.filter(
                      (u) => u.is_active
                    ).length
                  }
                </Badge>

                <Badge variant="outline">
                  Blocked: {
                    users.filter(
                      (u) => !u.is_active
                    ).length
                  }
                </Badge>

              </div>

            </CardContent>

          </Card>

        </div>


        <div className="mt-6">

          <Card>

            <CardHeader>

              <CardTitle>
                Users
              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="space-y-3">

                {users.map((entry) => (

                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >

                    <div>

                      <div className="font-medium">
                        {entry.email}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Role: {entry.role} • {
                          entry.is_active
                            ? 'Active'
                            : 'Blocked'
                        }
                      </div>

                    </div>


                    <div className="flex items-center gap-2">

                      <Badge
                        variant={
                          entry.is_active
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {
                          entry.is_active
                            ? 'Active'
                            : 'Blocked'
                        }
                      </Badge>


                      <Button
                        variant={
                          entry.is_active
                            ? 'destructive'
                            : 'default'
                        }
                        size="sm"
                        onClick={() =>
                          toggleUserAccess(entry)
                        }
                        disabled={
                          updatingId === entry.id
                        }
                      >

                        {
                          updatingId === entry.id ? (

                            <Loader2 className="h-4 w-4 animate-spin mr-2" />

                          ) : entry.is_active ? (

                            <UserX className="h-4 w-4 mr-2" />

                          ) : (

                            <UserCheck className="h-4 w-4 mr-2" />

                          )
                        }

                        {
                          entry.is_active
                            ? 'Block'
                            : 'Unblock'
                        }

                      </Button>

                    </div>

                  </div>

                ))}

              </div>

            </CardContent>

          </Card>

        </div>

      </main>

    </div>
  );
};

export default AdminDashboard;