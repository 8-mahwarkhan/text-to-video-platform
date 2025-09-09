import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Play, Sparkles, Wand2, Download, Video, Zap, Rocket, Star } from 'lucide-react';
import { toast } from 'sonner';
import { proceduralVideoGeneration } from '@/services/proceduralVideoGeneration';
import { comfyUIService } from '@/services/comfyUIService';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl"></div>
        <div className="relative container mx-auto px-4 pt-16 pb-12">
          <div className="text-center space-y-6 mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Video className="w-12 h-12 text-primary animate-pulse-glow" />
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg animate-pulse"></div>
              </div>
              <h1 className="text-6xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                AI Video Creator
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your imagination into stunning videos with cutting-edge AI technology. 
              Create professional videos from simple text descriptions in minutes.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">
                <Rocket className="w-4 h-4 mr-2" />
                AI Powered
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-accent/10 text-accent-foreground border-accent/20">
                <Zap className="w-4 h-4 mr-2" />
                Lightning Fast
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-secondary/10 text-secondary-foreground border-secondary/20">
                <Star className="w-4 h-4 mr-2" />
                Professional Quality
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Input Section */}
            <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
              <CardContent className="relative p-8 space-y-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Create Your Video
                  </h2>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground block">
                      Describe your vision
                    </label>
                    <Textarea
                      placeholder="A majestic eagle soaring through misty mountains at sunrise, cinematic 4K quality..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[140px] resize-none bg-background/70 border-border/50 focus:border-primary/50 text-base leading-relaxed"
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                {/* Generation Mode Toggle */}
                {comfyUIAvailable && (
                  <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Generation Mode</h3>
                        <p className="text-xs text-muted-foreground">
                          {useComfyUI 
                            ? 'AI-powered generation with ComfyUI'
                            : 'Quick procedural generation'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Quick</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUseComfyUI(!useComfyUI)}
                          className={`w-14 h-7 p-0 relative rounded-full transition-all ${
                            useComfyUI 
                              ? 'bg-primary shadow-glow-primary' 
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                          disabled={isGenerating}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 absolute ${
                            useComfyUI ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`} />
                        </Button>
                        <span className="text-sm text-muted-foreground">AI</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 border-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      {useComfyUI ? 'Creating AI Magic...' : 'Generating Video...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Generate Video
                    </>
                  )}
                </Button>

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="space-y-4 p-6 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="w-full h-2" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {statusMessage}
                    </p>
                  </div>
                )}

                {/* Example Prompts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">✨ Inspiration</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {examplePrompts.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(example)}
                        className="text-left w-full p-4 text-sm rounded-xl bg-gradient-to-r from-muted/20 to-muted/30 hover:from-primary/10 hover:to-accent/10 transition-all duration-300 border border-border/30 hover:border-primary/30 hover:shadow-lg group"
                        disabled={isGenerating}
                      >
                        <span className="group-hover:text-primary transition-colors">{example}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {!comfyUIAvailable && (
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
                        <Rocket className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-1">
                          Unlock AI Video Generation
                        </h4>
                        <p className="text-xs text-blue-300/80">
                          Install ComfyUI for professional AI-powered video creation
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
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-secondary opacity-5"></div>
              <CardContent className="relative p-8 space-y-6">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                  <Play className="w-6 h-6 text-primary" />
                  Your Video
                </h2>

                <div className="aspect-video bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border border-border/30 flex items-center justify-center overflow-hidden relative">
                  {isGenerating ? (
                    <div className="text-center space-y-6 p-8">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-primary opacity-20 animate-pulse absolute inset-0"></div>
                        <Loader2 className="w-20 h-20 animate-spin text-primary relative" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">
                          {useComfyUI ? 'Creating AI Magic...' : 'Generating Video...'}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          {statusMessage}
                        </p>
                        <div className="w-full max-w-sm mx-auto">
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ) : generatedVideo ? (
                    <video
                      controls
                      className="w-full h-full object-cover rounded-xl"
                      poster="/placeholder.svg"
                    >
                      <source src={generatedVideo} type="video/webm" />
                      <source src={generatedVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-center space-y-4 p-8">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto">
                        <Play className="w-12 h-12 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-foreground">Ready to Create?</h3>
                        <p className="text-sm text-muted-foreground">
                          Your amazing video will appear here once generated
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {generatedVideo && !isGenerating && (
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 h-12" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button className="flex-1 h-12 bg-gradient-primary hover:shadow-glow-primary" onClick={handleRegenerate}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            {useComfyUI && comfyUIAvailable 
              ? '🤖 AI Video Generation powered by ComfyUI'
              : '⚡ Procedural Video Generation running in your browser'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;