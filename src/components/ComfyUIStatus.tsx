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
      }
    } catch (error: any) {
      setIsConnected(false);
      setModels([]);
      
      if (error.message === 'CORS_ERROR') {
        toast.error('ComfyUI detected but CORS is blocking requests. Please start ComfyUI with --enable-cors-header flag.');
      } else {
        toast.error('Could not connect to ComfyUI server');
      }
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
            URL: http://localhost:8188
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
                <li>Start ComfyUI with CORS enabled:</li>
              </ol>
              <div className="mt-2 p-2 bg-black/20 rounded font-mono text-xs text-green-400">
                python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header
              </div>
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
                <p className="text-xs text-red-400">
                  <strong>CORS Issue:</strong> Your ComfyUI server is rejecting requests due to CORS policy. Make sure to start ComfyUI with the <code className="bg-black/20 px-1 rounded">--enable-cors-header</code> flag to allow cross-origin requests from this application.
                </p>
              </div>
              <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                <p className="text-xs text-blue-400">
                  <strong>Alternative:</strong> For production use, consider deploying ComfyUI on the same domain or using a cloud ComfyUI service to avoid CORS issues.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}