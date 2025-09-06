import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { comfyUIService } from '@/services/comfyUIService';
import { Play, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface ComfyUITesterProps {
  userId: string;
}

export const ComfyUITester = ({ userId }: ComfyUITesterProps) => {
  const [prompt, setPrompt] = useState('A beautiful sunset over a calm ocean with gentle waves');
  const [testing, setTesting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const { toast } = useToast();

  const runConnectionTest = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      // Get user settings first
      const { data: settings } = await supabase
        .from('comfyui_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!settings) {
        throw new Error('No settings found. Please configure your ComfyUI settings first.');
      }

      const results = {
        server_available: false,
        models_loaded: false,
        websocket_connected: false,
        error: null,
      };

      // Test server availability
      try {
        const isAvailable = await comfyUIService.isServerAvailable();
        results.server_available = isAvailable;
      } catch (error: any) {
        results.error = error.message;
      }

      // Test model loading
      if (results.server_available) {
        try {
          const models = await comfyUIService.getModels();
          results.models_loaded = models.length > 0;
        } catch (error: any) {
          results.error = error.message;
        }
      }

      // Test WebSocket connection
      if (results.server_available) {
        try {
          await comfyUIService.connectWebSocket();
          results.websocket_connected = true;
        } catch (error: any) {
          results.error = error.message;
        }
      }

      setTestResults(results);

      if (results.server_available && results.models_loaded && results.websocket_connected) {
        toast({
          title: "All tests passed!",
          description: "Your ComfyUI setup is working correctly.",
        });
      } else {
        toast({
          title: "Some tests failed",
          description: "Check the results below for details.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
      setTestResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const runGenerationTest = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for testing.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setProgress(0);
    setStatus('Starting generation...');
    setVideoUrl('');

    try {
      // Record generation start
      const { data: generation, error: insertError } = await supabase
        .from('generation_history')
        .insert({
          user_id: userId,
          prompt,
          status: 'pending',
          settings: { test: true },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const startTime = Date.now();

      const videoUrl = await comfyUIService.generateVideo(prompt, {
        onProgress: (progressValue, statusText) => {
          setProgress(progressValue);
          setStatus(statusText);
        },
      });

      const endTime = Date.now();
      const generationTime = endTime - startTime;

      // Update generation record
      await supabase
        .from('generation_history')
        .update({
          status: 'completed',
          video_url: videoUrl,
          generation_time: generationTime,
        })
        .eq('id', generation.id);

      setVideoUrl(videoUrl);
      toast({
        title: "Generation successful!",
        description: `Video generated in ${Math.round(generationTime / 1000)}s`,
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
      setStatus(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const TestResult = ({ label, passed, error }: { label: string; passed: boolean; error?: string }) => (
    <div className="flex items-center gap-2 p-2 border rounded">
      {passed ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <span className="font-medium">{label}</span>
      {error && <span className="text-sm text-muted-foreground">({error})</span>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Connection Test
            </CardTitle>
            <CardDescription>
              Test your ComfyUI server connection and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runConnectionTest} disabled={testing} className="w-full">
              {testing ? 'Testing...' : 'Run Connection Test'}
            </Button>
            
            {testResults && (
              <div className="space-y-2">
                <h4 className="font-medium">Test Results:</h4>
                <TestResult 
                  label="Server Available" 
                  passed={testResults.server_available}
                />
                <TestResult 
                  label="Models Loaded" 
                  passed={testResults.models_loaded}
                />
                <TestResult 
                  label="WebSocket Connected" 
                  passed={testResults.websocket_connected}
                />
                {testResults.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{testResults.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Generation Test
            </CardTitle>
            <CardDescription>
              Generate a test video to verify your setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-prompt">Test Prompt</Label>
              <Textarea
                id="test-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt for testing..."
                rows={3}
              />
            </div>
            
            <Button onClick={runGenerationTest} disabled={generating} className="w-full">
              {generating ? 'Generating...' : 'Generate Test Video'}
            </Button>
            
            {generating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">{status}</p>
              </div>
            )}
            
            {videoUrl && (
              <div className="space-y-2">
                <h4 className="font-medium">Generated Video:</h4>
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full rounded border"
                  style={{ maxHeight: '200px' }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => window.open(videoUrl, '_blank')}
                  className="w-full"
                >
                  Open in New Tab
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};