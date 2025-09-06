import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Database, History, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ComfyUISettings } from './admin/ComfyUISettings';
import { ModelManager } from './admin/ModelManager';
import { GenerationHistory } from './admin/GenerationHistory';
import { ComfyUITester } from './admin/ComfyUITester';

interface AdminPanelProps {
  user: User;
}

export const AdminPanel = ({ user }: AdminPanelProps) => {
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name || user.email}
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="models">
              <Database className="h-4 w-4 mr-2" />
              Models
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="test">
              <Upload className="h-4 w-4 mr-2" />
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>ComfyUI Configuration</CardTitle>
                <CardDescription>
                  Configure your ComfyUI server settings and API parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComfyUISettings userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>Model Management</CardTitle>
                <CardDescription>
                  Manage your ComfyUI models and checkpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelManager userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Generation History</CardTitle>
                <CardDescription>
                  View your video generation history and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenerationHistory userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>ComfyUI Testing</CardTitle>
                <CardDescription>
                  Test your ComfyUI connection and generate sample videos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComfyUITester userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};