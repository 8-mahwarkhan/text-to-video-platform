import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { comfyUIService } from '@/services/comfyUIService';
import { toast } from 'sonner';

export function ComfyUIStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [models, setModels] = useState<string[]>([]);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const available = await comfyUIService.isServerAvailable();
      setIsConnected(available);
      
      if (available) {
        const availableModels = await comfyUIService.getModels();
        setModels(availableModels);
        toast.success('Connected to ComfyUI successfully!');
      } else {
        setModels([]);
        toast.error('Could not connect to ComfyUI server');
      }
    } catch (error) {
      setIsConnected(false);
      setModels([]);
      toast.error('Failed to check ComfyUI connection');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">ComfyUI Status</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={isChecking}
            className="bg-background/30"
          >
            {isChecking ? 'Checking...' : 'Refresh'}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-foreground">
              Server Status: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            URL: http://127.0.0.1:8188
          </div>

          {isConnected && models.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Available Models ({models.length})
              </label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {models.slice(0, 10).map((model, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs bg-background/30"
                  >
                    {model.replace('.safetensors', '').replace('.ckpt', '')}
                  </Badge>
                ))}
                {models.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{models.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400">
                ComfyUI server not detected. To enable AI video generation:
              </p>
              <ol className="text-xs text-yellow-300/80 mt-2 space-y-1 list-decimal list-inside">
                <li>Install ComfyUI following our setup guide</li>
                <li>Start ComfyUI with: <code className="bg-black/20 px-1 rounded">python main.py --listen 0.0.0.0 --port 8188</code></li>
                <li>Refresh this status panel</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}