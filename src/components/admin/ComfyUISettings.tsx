import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, TestTube } from 'lucide-react';

interface ComfyUISettingsProps {
  userId: string;
}

interface Settings {
  server_url: string;
  api_timeout: number;
  max_queue_size: number;
  auto_retry: boolean;
  retry_attempts: number;
}

export const ComfyUISettings = ({ userId }: ComfyUISettingsProps) => {
  const [settings, setSettings] = useState<Settings>({
    server_url: 'http://localhost:8188',
    api_timeout: 30000,
    max_queue_size: 10,
    auto_retry: true,
    retry_attempts: 3,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('comfyui_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          server_url: data.server_url,
          api_timeout: data.api_timeout,
          max_queue_size: data.max_queue_size,
          auto_retry: data.auto_retry,
          retry_attempts: data.retry_attempts,
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('comfyui_settings')
        .upsert({
          user_id: userId,
          ...settings,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your ComfyUI settings have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch(`${settings.server_url}/system_stats`);
      if (response.ok) {
        toast({
          title: "Connection successful",
          description: "ComfyUI server is reachable and responding.",
        });
      } else {
        throw new Error('Server responded with error');
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: "Cannot connect to ComfyUI server. Please check your settings.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="server_url">Server URL</Label>
          <Input
            id="server_url"
            value={settings.server_url}
            onChange={(e) => setSettings({ ...settings, server_url: e.target.value })}
            placeholder="http://localhost:8188"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="api_timeout">API Timeout (ms)</Label>
            <Input
              id="api_timeout"
              type="number"
              value={settings.api_timeout}
              onChange={(e) => setSettings({ ...settings, api_timeout: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_queue_size">Max Queue Size</Label>
            <Input
              id="max_queue_size"
              type="number"
              value={settings.max_queue_size}
              onChange={(e) => setSettings({ ...settings, max_queue_size: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="auto_retry"
            checked={settings.auto_retry}
            onCheckedChange={(checked) => setSettings({ ...settings, auto_retry: checked })}
          />
          <Label htmlFor="auto_retry">Enable Auto Retry</Label>
        </div>

        {settings.auto_retry && (
          <div className="space-y-2">
            <Label htmlFor="retry_attempts">Retry Attempts</Label>
            <Input
              id="retry_attempts"
              type="number"
              value={settings.retry_attempts}
              onChange={(e) => setSettings({ ...settings, retry_attempts: parseInt(e.target.value) })}
              min="1"
              max="10"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button onClick={testConnection} variant="outline" disabled={testing}>
          <TestTube className="h-4 w-4 mr-2" />
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>
    </div>
  );
};