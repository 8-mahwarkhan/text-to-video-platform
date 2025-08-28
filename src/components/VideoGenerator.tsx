import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Play, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoGeneratorProps {}

const VideoGenerator: React.FC<VideoGeneratorProps> = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const examplePrompts = [
    "A majestic eagle soaring through mountain peaks at sunset",
    "Ocean waves crashing against rocky cliffs in slow motion",
    "A bustling cyberpunk city street at night with neon lights",
    "Time-lapse of flowers blooming in a meadow during spring",
    "A astronaut floating in space with Earth in the background"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate video');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating your video...', {
      description: 'This may take a few moments'
    });

    try {
      // Simulate API call with realistic timing
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // For MVP, we'll use a placeholder video URL
      // In production, this would be replaced with actual video generation API
      setGeneratedVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
      
      toast.success('Video generated successfully!');
    } catch (error) {
      toast.error('Failed to generate video', {
        description: 'Please try again with a different prompt'
      });
    } finally {
      setIsGenerating(false);
    }
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
            Transform your ideas into stunning videos with the power of AI. 
            Simply describe what you want to see and watch it come to life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Describe your video
                </label>
                <Textarea
                  placeholder="Describe the video you want to create in detail..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>

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
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Video
                  </>
                )}
              </Button>

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
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
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
                      <p className="text-sm font-medium">Generating your video...</p>
                      <p className="text-xs text-muted-foreground">This may take a few moments</p>
                    </div>
                  </div>
                ) : generatedVideo ? (
                  <video
                    controls
                    className="w-full h-full object-cover rounded-lg"
                    poster="/placeholder.svg"
                  >
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
                  <Button variant="outline" size="sm" className="flex-1">
                    Download
                  </Button>
                  <Button variant="ai" size="sm" className="flex-1">
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Status Info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            MVP Version - Video generation is simulated for testing purposes
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;