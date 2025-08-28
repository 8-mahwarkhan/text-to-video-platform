import { toast } from 'sonner';

interface VideoGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  frames?: number;
  fps?: number;
}

interface GeneratedVideo {
  videoUrl: string;
  duration: number;
  prompt: string;
}

export class ProceduralVideoGenerationService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('Procedural video generation service initialized');
  }

  async generateVideo(options: VideoGenerationOptions): Promise<GeneratedVideo> {
    await this.initialize();

    const { prompt, width = 512, height = 512, frames = 30, fps = 10 } = options;

    try {
      toast.info('Analyzing prompt...', {
        description: 'Creating visual interpretation'
      });

      // Analyze prompt to determine visual style
      const visualStyle = this.analyzePrompt(prompt);
      
      toast.info('Generating video frames...', {
        description: `Creating ${frames} frames for your video`
      });

      // Generate frames based on prompt analysis
      const generatedFrames = await this.generateFrames(visualStyle, width, height, frames);
      
      toast.info('Assembling video...', {
        description: 'Converting frames to video'
      });

      // Convert frames to video
      const videoUrl = await this.framesToVideo(generatedFrames, fps);
      
      const duration = frames / fps;

      return {
        videoUrl,
        duration,
        prompt
      };

    } catch (error) {
      console.error('Video generation failed:', error);
      throw new Error('Failed to generate video. Please try a different prompt.');
    }
  }

  private analyzePrompt(prompt: string): any {
    const lowerPrompt = prompt.toLowerCase();
    
    // Determine color scheme
    let colors = ['#4338ca', '#7c3aed', '#db2777']; // Default purple/blue
    
    if (lowerPrompt.includes('sunset') || lowerPrompt.includes('orange') || lowerPrompt.includes('warm')) {
      colors = ['#f59e0b', '#ef4444', '#dc2626'];
    } else if (lowerPrompt.includes('ocean') || lowerPrompt.includes('blue') || lowerPrompt.includes('water')) {
      colors = ['#0ea5e9', '#3b82f6', '#1d4ed8'];
    } else if (lowerPrompt.includes('nature') || lowerPrompt.includes('green') || lowerPrompt.includes('forest')) {
      colors = ['#10b981', '#059669', '#065f46'];
    } else if (lowerPrompt.includes('fire') || lowerPrompt.includes('red')) {
      colors = ['#ef4444', '#dc2626', '#991b1b'];
    } else if (lowerPrompt.includes('night') || lowerPrompt.includes('dark') || lowerPrompt.includes('space')) {
      colors = ['#1e1b4b', '#312e81', '#3730a3'];
    }

    // Determine animation type
    let animationType = 'wave';
    
    if (lowerPrompt.includes('spiral') || lowerPrompt.includes('swirl') || lowerPrompt.includes('tornado')) {
      animationType = 'spiral';
    } else if (lowerPrompt.includes('particles') || lowerPrompt.includes('stars') || lowerPrompt.includes('sparkle')) {
      animationType = 'particles';
    } else if (lowerPrompt.includes('geometric') || lowerPrompt.includes('abstract')) {
      animationType = 'geometric';
    } else if (lowerPrompt.includes('flowing') || lowerPrompt.includes('fluid') || lowerPrompt.includes('wave')) {
      animationType = 'wave';
    } else if (lowerPrompt.includes('pulsing') || lowerPrompt.includes('breathing') || lowerPrompt.includes('heartbeat')) {
      animationType = 'pulse';
    }

    // Determine speed
    let speed = 1;
    if (lowerPrompt.includes('fast') || lowerPrompt.includes('quick') || lowerPrompt.includes('rapid')) {
      speed = 2;
    } else if (lowerPrompt.includes('slow') || lowerPrompt.includes('gentle') || lowerPrompt.includes('calm')) {
      speed = 0.5;
    }

    return {
      colors,
      animationType,
      speed,
      prompt
    };
  }

  private async generateFrames(visualStyle: any, width: number, height: number, frameCount: number): Promise<ImageData[]> {
    const frames: ImageData[] = [];
    
    for (let i = 0; i < frameCount; i++) {
      const progress = i / frameCount;
      const frame = this.generateFrame(visualStyle, width, height, progress);
      frames.push(frame);
    }
    
    return frames;
  }

  private generateFrame(visualStyle: any, width: number, height: number, progress: number): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    const { colors, animationType, speed } = visualStyle;
    const time = progress * Math.PI * 2 * speed;
    
    switch (animationType) {
      case 'spiral':
        this.drawSpiral(ctx, width, height, time, colors);
        break;
      case 'particles':
        this.drawParticles(ctx, width, height, time, colors);
        break;
      case 'geometric':
        this.drawGeometric(ctx, width, height, time, colors);
        break;
      case 'wave':
        this.drawWave(ctx, width, height, time, colors);
        break;
      case 'pulse':
        this.drawPulse(ctx, width, height, time, colors);
        break;
      default:
        this.drawWave(ctx, width, height, time, colors);
    }
    
    return ctx.getImageData(0, 0, width, height);
  }

  private drawSpiral(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colors: string[]) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < 100; i++) {
      const angle = (i * 0.1) + time;
      const radius = i * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length] + Math.floor((1 - i / 100) * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colors: string[]) {
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(time + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(time * 0.7 + i * 0.3) * 0.5 + 0.5) * height;
      const size = Math.sin(time * 2 + i) * 3 + 5;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length] + '80';
      ctx.fill();
    }
  }

  private drawGeometric(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colors: string[]) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(time + i * Math.PI / 3);
      
      const size = 50 + Math.sin(time * 2) * 20;
      ctx.fillStyle = colors[i % colors.length] + '60';
      ctx.fillRect(-size/2, -size/2, size, size);
      
      ctx.restore();
    }
  }

  private drawWave(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colors: string[]) {
    const amplitude = height * 0.2;
    const frequency = 0.02;
    const centerY = height / 2;
    
    for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
      ctx.beginPath();
      const offset = colorIndex * 50;
      
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * frequency + time + offset * 0.1) * amplitude * (1 - colorIndex * 0.2);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.strokeStyle = colors[colorIndex] + '80';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  private drawPulse(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colors: string[]) {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2;
    
    for (let i = 0; i < colors.length; i++) {
      const pulse = Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5;
      const radius = maxRadius * pulse * (1 - i * 0.2);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = colors[i] + Math.floor(pulse * 100).toString(16).padStart(2, '0');
      ctx.fill();
    }
  }

  private async framesToVideo(frames: ImageData[], fps: number): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        if (frames.length === 0) {
          reject(new Error('No frames to convert'));
          return;
        }

        canvas.width = frames[0].width;
        canvas.height = frames[0].height;

        const stream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          resolve(videoUrl);
        };

        mediaRecorder.onerror = () => {
          reject(new Error('MediaRecorder error'));
        };

        // Start recording
        mediaRecorder.start();

        // Draw frames with timing
        let frameIndex = 0;
        const frameInterval = 1000 / fps;

        const drawFrame = () => {
          if (frameIndex < frames.length) {
            ctx.putImageData(frames[frameIndex], 0, 0);
            frameIndex++;
            setTimeout(drawFrame, frameInterval);
          } else {
            setTimeout(() => {
              mediaRecorder.stop();
            }, frameInterval);
          }
        };

        drawFrame();

      } catch (error) {
        reject(error);
      }
    });
  }

  async isWebGPUSupported(): Promise<boolean> {
    try {
      if (!(navigator as any).gpu) return false;
      const adapter = await (navigator as any).gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  async getSystemCapabilities() {
    const webgpuSupported = await this.isWebGPUSupported();
    const memory = (navigator as any).deviceMemory || 'unknown';
    const hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';

    return {
      webgpuSupported,
      memory,
      hardwareConcurrency,
      recommendations: [
        'This generates procedural videos based on your text prompts',
        'For more realistic results, consider using cloud-based AI services',
        'Try prompts like: "blue ocean waves", "red spiral galaxy", "green forest particles"'
      ]
    };
  }
}

export const proceduralVideoGeneration = new ProceduralVideoGenerationService();