import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Play, Sparkles, Wand2, Download, Info, Cpu, Zap, Settings, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { proceduralVideoGeneration } from '@/services/proceduralVideoGeneration';
import { comfyUIService } from '@/services/comfyUIService';
import { ComfyUIStatus } from '@/components/ComfyUIStatus';

interface VideoGeneratorProps {}

const VideoGenerator: React.FC<VideoGeneratorProps> = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [useComfyUI, setUseComfyUI] = useState(false);
  const [comfyUIAvailable, setComfyUIAvailable] = useState(false);
  const [systemCapabilities, setSystemCapabilities] = useState<any>(null);

  const examplePrompts = [
    "A cat walking in a beautiful garden, cinematic style",
    "Ocean waves crashing on beach with golden sunset", 
    "Futuristic city with flying cars, cyberpunk aesthetic",
    "Magical forest with glowing particles and fairy lights",
    "Steam locomotive moving through snowy mountains"
  ];

  // Check ComfyUI availability on component mount
  useEffect(() => {
    const checkComfyUI = async () => {
      try {
        const available = await comfyUIService.isServerAvailable();
        setComfyUIAvailable(available);
        if (available) {
          setUseComfyUI(true);
          toast.success('ComfyUI detected! Using AI video generation.');
        } else {
          toast.info('ComfyUI not detected. Using procedural generation.');
        }
      } catch (error) {
        setComfyUIAvailable(false);
        toast.info('ComfyUI not available. Using procedural generation.');
      }
    };
    
    const checkCapabilities = async () => {
      const capabilities = await proceduralVideoGeneration.getSystemCapabilities();
      setSystemCapabilities(capabilities);
    };
    
    checkComfyUI();
    checkCapabilities();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedVideo(null);
    setStatusMessage('Starting generation...');

    try {
      if (useComfyUI && comfyUIAvailable) {
        // Use ComfyUI for real AI video generation
        toast.info('🤖 Generating AI video with ComfyUI...', {
          description: 'This may take several minutes'
        });

        const videoUrl = await comfyUIService.generateVideo(prompt.trim(), {
          width: 512,
          height: 512,
          onProgress: (progress, status) => {
            setProgress(progress);
            setStatusMessage(status);
          }
        });

        setGeneratedVideo(videoUrl);
        setProgress(100);
        setStatusMessage('AI video generated successfully!');
        
        toast.success('🎉 AI video generated successfully!', {
          description: 'Your video is ready to download'
        });

      } else {
        // Fallback to procedural generation
        toast.info('🎬 Generating procedural video...', {
          description: 'This may take a few moments'
        });

        const result = await proceduralVideoGeneration.generateVideo({
          prompt: prompt.trim(),
          width: 512,
          height: 512,
          frames: 30,
          fps: 10
        });

        setGeneratedVideo(result.videoUrl);
        setProgress(100);
        setStatusMessage('Procedural video generated successfully!');
        
        toast.success('🎉 Video generated successfully!', {
          description: `Duration: ${result.duration.toFixed(1)}s`
        });
      }

    } catch (error) {
      console.error('Generation failed:', error);
      
      if (useComfyUI && error instanceof Error && error.message.includes('not running')) {
        toast.error('ComfyUI Server Not Running', {
          description: 'Please start ComfyUI server first. Check setup guide.'
        });
        setStatusMessage('ComfyUI server not available');
      } else {
        toast.error('Failed to generate video', {
          description: 'Please try a different prompt or check your connection'
        });
        setStatusMessage('Generation failed');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedVideo) {
      const a = document.createElement('a');
      a.href = generatedVideo;
      a.download = `generated-video-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleRegenerate = () => {
    if (generatedVideo) {
      URL.revokeObjectURL(generatedVideo);
      setGeneratedVideo(null);
    }
    handleGenerate();
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wand2 className="w-8 h-8 text-primary animate-pulse-glow" />
            <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              AI Video Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transform your text prompts into stunning videos using advanced AI technology
          </p>
          
          {/* Generation Mode Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              comfyUIAvailable 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                comfyUIAvailable ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              {comfyUIAvailable ? 'ComfyUI AI Generation' : 'Procedural Generation'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Video Prompt
                </label>
                <Textarea
                  placeholder={
                    comfyUIAvailable 
                      ? "Describe the video you want to generate... (e.g., 'A cat walking in a garden, cinematic style')"
                      : "Describe the visual style you want... (e.g., 'Blue ocean waves flowing gently')"
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
                  disabled={isGenerating}
                />
              </div>

              {/* Generation Mode Toggle */}
              {comfyUIAvailable && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Generation Mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {useComfyUI 
                        ? 'Using ComfyUI for AI-powered video generation'
                        : 'Using procedural generation for quick results'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Procedural</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUseComfyUI(!useComfyUI)}
                      className={`w-12 h-6 p-0 relative ${useComfyUI ? 'bg-primary' : 'bg-muted'}`}
                      disabled={isGenerating}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute ${
                        useComfyUI ? 'translate-x-3' : 'translate-x-0'
                      }`} />
                    </Button>
                    <span className="text-sm text-muted-foreground">AI</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                variant="generate"
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {useComfyUI ? 'Generating AI Video...' : 'Generating Video...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Video
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-muted-foreground text-center">
                    {statusMessage}
                  </p>
                </div>
              )}

              {/* Example Prompts */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Try these example prompts:
                </p>
                <div className="space-y-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      className="text-left w-full p-3 text-sm rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30 hover:border-primary/30"
                      disabled={isGenerating}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Setup Guide Link */}
              {!comfyUIAvailable && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="text-blue-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-400">
                        Want Real AI Video Generation?
                      </p>
                      <p className="text-xs text-blue-300/80 mt-1">
                        Install ComfyUI locally for professional AI video generation. Check the setup guide for instructions.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://github.com/comfyanonymous/ComfyUI', '_blank')}
                      className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                    >
                      Setup Guide
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Output Section */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Play className="w-5 h-5" />
                Generated Video
              </h3>

              <div className="aspect-video bg-muted/30 rounded-lg border border-border/30 flex items-center justify-center overflow-hidden">
                {isGenerating ? (
                  <div className="text-center space-y-4">
                    <div className="animate-pulse-glow">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {useComfyUI ? 'Generating AI video...' : 'Generating video...'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {statusMessage}
                      </p>
                      <div className="w-full max-w-xs mx-auto">
                        <Progress value={progress} className="h-1" />
                      </div>
                    </div>
                  </div>
                ) : generatedVideo ? (
                  <video
                    controls
                    className="w-full h-full object-cover rounded-lg"
                    poster="/placeholder.svg"
                  >
                    <source src={generatedVideo} type="video/webm" />
                    <source src={generatedVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your generated video will appear here
                    </p>
                  </div>
                )}
              </div>

              {generatedVideo && !isGenerating && (
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button variant="ai" size="sm" className="flex-1" onClick={handleRegenerate}>
                    <Sparkles className="w-4 h-4" />
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ComfyUI Status Panel */}
        <ComfyUIStatus />

        {/* Performance Tips */}
        {systemCapabilities?.recommendations && (
          <Card className="p-4 bg-muted/30 border-border/50">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {useComfyUI ? 'AI Generation Tips' : 'Performance Tips'}
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {useComfyUI ? [
                'Use descriptive prompts with cinematic terms for better results',
                'Include style keywords like "cinematic", "realistic", "4K quality"',
                'Video generation may take 2-10 minutes depending on your hardware',
                'Ensure ComfyUI is running with video generation models installed'
              ].map((tip: string, index: number) => (
                <li key={index}>• {tip}</li>
              )) : systemCapabilities.recommendations.map((tip: string, index: number) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Status Info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {useComfyUI && comfyUIAvailable 
              ? 'Real AI Video Generation - Running locally via ComfyUI'
              : 'Procedural Video Generation - Running locally in browser'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;