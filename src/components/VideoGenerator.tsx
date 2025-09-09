import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Play, Sparkles, Download, Video, Volume2, Settings, ChevronDown, RefreshCw, Image, Layers3 } from 'lucide-react';
import { toast } from 'sonner';
import { proceduralVideoGeneration } from '@/services/proceduralVideoGeneration';
import { comfyUIService } from '@/services/comfyUIService';

interface VideoGeneratorProps {}

const VideoGenerator: React.FC<VideoGeneratorProps> = () => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [useComfyUI, setUseComfyUI] = useState(false);
  const [comfyUIAvailable, setComfyUIAvailable] = useState(false);
  const [systemCapabilities, setSystemCapabilities] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState('KLING 2.1 Master');
  const [generationMode, setGenerationMode] = useState('text-to-video');
  const [soundEffects, setSoundEffects] = useState(true);
  const [integratedSound, setIntegratedSound] = useState(true);
  const [duration, setDuration] = useState('10s');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [outputCount, setOutputCount] = useState('1');
  const [credits] = useState(1250);

  const examplePrompts = [
    "Rabbit",
    "Volcano", 
    "Lion",
    "Cyber City"
  ];

  const models = [
    { name: 'KLING 2.1 Master', isNew: true, available: true },
    { name: 'DeepSeek-R1', isNew: false, available: false },
    { name: 'Stable Video Diffusion', isNew: false, available: true },
    { name: 'AnimateDiff', isNew: false, available: true }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Video className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">AI Video Generator</h1>
            </div>
            
            {/* Model Selector */}
            <div className="flex items-center gap-4">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-64 bg-card/80 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem 
                      key={model.name} 
                      value={model.name}
                      disabled={!model.available}
                    >
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        {model.isNew && (
                          <Badge variant="secondary" className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400">
                            NEW
                          </Badge>
                        )}
                        {!model.available && (
                          <Badge variant="outline" className="px-2 py-0.5 text-xs text-muted-foreground">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-sm text-muted-foreground">
                Credits: <span className="text-primary font-semibold">{credits}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generation Mode Tabs */}
            <Tabs value={generationMode} onValueChange={setGenerationMode}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text-to-video" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Text to Video
                </TabsTrigger>
                <TabsTrigger value="image-to-video" className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Image to Video
                </TabsTrigger>
                <TabsTrigger value="multi-elem" className="flex items-center gap-2">
                  <Layers3 className="w-4 h-4" />
                  Multi-Elem
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text-to-video" className="space-y-6 mt-6">
                {selectedModel === 'DeepSeek-R1' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                      Text to Video is not available with KLING 2.1. Switched to a compatible model
                    </div>
                  </div>
                )}

                {/* Main Prompt */}
                <Card className="border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Prompt <span className="text-red-400">(Required)</span>
                      </label>
                      <Textarea
                        placeholder="black hole's luminous energy fields swirl intensely, concentric rings and spirals rotate slowly, vibrant cosmic hues of blue, purple, and yellow create a mysterious atmosphere, the camera zooms out gradually."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[120px] resize-none bg-background/70 border-border/50 focus:border-primary/50"
                        disabled={isGenerating}
                      />
                    </div>

                    {/* Quick Hints */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">Hints:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Shuffle hints
                            const shuffled = [...examplePrompts].sort(() => Math.random() - 0.5);
                            // You could update the hints here
                          }}
                          className="p-1 h-6 w-6"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((hint, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => setPrompt(hint)}
                            className="h-8 px-3 text-xs bg-muted/30 hover:bg-muted/60 border-border/30"
                            disabled={isGenerating}
                          >
                            {hint}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Sound Effects */}
                <Card className="border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5 text-foreground" />
                        <div>
                          <h3 className="font-medium text-foreground">Sound Effects</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="px-2 py-1 text-xs bg-green-500/20 text-green-400">
                              Free for now
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch 
                        checked={soundEffects} 
                        onCheckedChange={setSoundEffects}
                        disabled={isGenerating}
                      />
                    </div>
                    
                    {soundEffects && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Integrated sound with video generation</span>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={integratedSound} 
                              onCheckedChange={setIntegratedSound}
                              disabled={isGenerating}
                            />
                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Negative Prompt */}
                <Card className="border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Negative Prompt <span className="text-muted-foreground">(Optional)</span>
                      </label>
                      <Textarea
                        placeholder="List the types of content you don't want to see in the video. Examples: animation, blur, distortion, disfigurement, low quality, collage, grainy..."
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="min-h-[80px] resize-none bg-background/70 border-border/50 focus:border-primary/50"
                        disabled={isGenerating}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Generation Settings */}
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Duration</label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger className="bg-background/70">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5s">5s</SelectItem>
                            <SelectItem value="10s">10s</SelectItem>
                            <SelectItem value="15s">15s</SelectItem>
                            <SelectItem value="30s">30s</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                          <SelectTrigger className="bg-background/70">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">16:9</SelectItem>
                            <SelectItem value="9:16">9:16</SelectItem>
                            <SelectItem value="1:1">1:1</SelectItem>
                            <SelectItem value="4:3">4:3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Output</label>
                        <Select value={outputCount} onValueChange={setOutputCount}>
                          <SelectTrigger className="bg-background/70">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Output</SelectItem>
                            <SelectItem value="2">2 Outputs</SelectItem>
                            <SelectItem value="4">4 Outputs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="image-to-video" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Image to Video</h3>
                      <p className="text-sm text-muted-foreground">Upload an image to animate it into a video</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="multi-elem" className="space-y-6 mt-6">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Layers3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Multi-Element</h3>
                      <p className="text-sm text-muted-foreground">Combine multiple elements to create complex videos</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Credit Activity & Generate Button */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Credit Activity</span>
                  <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full h-14 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate ⚡ 200
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            {/* Preview Area */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="aspect-video bg-muted/20 rounded-lg border border-border/30 flex items-center justify-center overflow-hidden relative">
                  {isGenerating ? (
                    <div className="text-center space-y-4 p-8">
                      <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-medium">Generating Video...</h3>
                        <p className="text-sm text-muted-foreground">{statusMessage}</p>
                        <div className="w-full max-w-xs mx-auto">
                          <Progress value={progress} className="h-2" />
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
                    <div className="text-center space-y-4 p-8">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Play className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Your video will appear here
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress for active generation */}
                {isGenerating && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                  </div>
                )}

                {/* Action buttons */}
                {generatedVideo && !isGenerating && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleRegenerate}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Success Message */}
            {generatedVideo && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                      <span className="text-green-400 text-sm">✓</span>
                    </div>
                    <p className="text-sm text-green-400 font-medium">Generation Complete!</p>
                    <p className="text-xs text-muted-foreground">
                      Share your creativity, and I'll help polish them.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {generatedVideo && (
              <div className="text-xs text-muted-foreground text-center">
                Disclaimer: This content was generated by AI. Please review and evaluate it carefully.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;