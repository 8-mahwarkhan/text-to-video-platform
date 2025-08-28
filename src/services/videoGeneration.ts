import { pipeline, env } from '@huggingface/transformers';
import { toast } from 'sonner';

// Configure transformers.js for optimal performance
env.allowLocalModels = false;
env.useBrowserCache = true;

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

export class LocalVideoGenerationService {
  private imageGenerator: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing video generation service...');
      toast.info('Loading AI models...', {
        description: 'This may take a moment on first load'
      });

      // Initialize image generation pipeline with WebGPU for better performance
      this.imageGenerator = await pipeline(
        'image-to-image' as any,
        'Xenova/stable-diffusion-2-1-base',
        { 
          device: 'webgpu',
          dtype: 'fp16' // Use half precision for better performance
        }
      );

      this.isInitialized = true;
      console.log('Video generation service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize video generation service:', error);
      
      // Fallback to CPU if WebGPU fails
      try {
        console.log('Fallback: Initializing with CPU...');
        this.imageGenerator = await pipeline(
          'image-to-image' as any, 
          'Xenova/stable-diffusion-2-1-base'
        );
        this.isInitialized = true;
        toast.warning('Using CPU for generation (slower)', {
          description: 'WebGPU not available, performance may be limited'
        });
      } catch (cpuError) {
        console.error('CPU fallback also failed:', cpuError);
        throw new Error('Failed to initialize video generation models');
      }
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<GeneratedVideo> {
    await this.initialize();

    const { prompt, width = 512, height = 512, frames = 24, fps = 8 } = options;

    try {
      toast.info('Generating video frames...', {
        description: `Creating ${frames} frames for your video`
      });

      // Generate sequence of images for video frames
      const framePromises: Promise<any>[] = [];
      const framePrompts = this.generateFramePrompts(prompt, frames);

      for (let i = 0; i < frames; i++) {
        const framePromise = this.generateFrame(framePrompts[i], width, height, i);
        framePromises.push(framePromise);
      }

      // Generate all frames
      const generatedFrames = await Promise.all(framePromises);
      
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
      throw new Error('Failed to generate video. Please try a simpler prompt.');
    }
  }

  private generateFramePrompts(basePrompt: string, frameCount: number): string[] {
    const prompts: string[] = [];
    
    // Create variations of the base prompt for different frames
    const variations = [
      '',
      ', cinematic lighting',
      ', dynamic angle',
      ', close-up view',
      ', wide shot',
      ', dramatic lighting',
      ', soft lighting',
      ', golden hour',
      ', detailed view',
      ', artistic composition'
    ];

    for (let i = 0; i < frameCount; i++) {
      const variationIndex = i % variations.length;
      const framePrompt = basePrompt + variations[variationIndex];
      prompts.push(framePrompt);
    }

    return prompts;
  }

  private async generateFrame(prompt: string, width: number, height: number, frameIndex: number): Promise<ImageData> {
    try {
      // Add some variation to the seed for each frame
      const seed = Math.floor(Math.random() * 1000000) + frameIndex;
      
      const result = await this.imageGenerator(prompt, {
        width,
        height,
        num_inference_steps: 20, // Reduce steps for faster generation
        guidance_scale: 7.5,
        seed
      });

      // Convert the result to ImageData
      return this.tensorToImageData(result, width, height);
      
    } catch (error) {
      console.error(`Failed to generate frame ${frameIndex}:`, error);
      // Return a placeholder frame if generation fails
      return this.createPlaceholderFrame(width, height);
    }
  }

  private tensorToImageData(tensor: any, width: number, height: number): ImageData {
    // Convert tensor to ImageData
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Convert tensor data to image data
    const imageData = ctx.createImageData(width, height);
    const data = tensor.data || tensor;
    
    // Normalize and convert tensor values to RGB
    for (let i = 0; i < data.length; i += 3) {
      const pixelIndex = (i / 3) * 4;
      imageData.data[pixelIndex] = Math.round(data[i] * 255);     // R
      imageData.data[pixelIndex + 1] = Math.round(data[i + 1] * 255); // G
      imageData.data[pixelIndex + 2] = Math.round(data[i + 2] * 255); // B
      imageData.data[pixelIndex + 3] = 255; // A
    }
    
    return imageData;
  }

  private createPlaceholderFrame(width: number, height: number): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Create a gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return ctx.getImageData(0, 0, width, height);
  }

  private async framesToVideo(frames: ImageData[], fps: number): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create video from frames using MediaRecorder API
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

        mediaRecorder.onerror = (event) => {
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
            // Stop recording after all frames are drawn
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
      recommendations: this.getPerformanceRecommendations(webgpuSupported, memory)
    };
  }

  private getPerformanceRecommendations(webgpuSupported: boolean, memory: number | string) {
    const recommendations: string[] = [];
    
    if (!webgpuSupported) {
      recommendations.push('Enable WebGPU in your browser for better performance');
    }
    
    if (typeof memory === 'number' && memory < 8) {
      recommendations.push('Low device memory detected - consider shorter videos');
    }
    
    recommendations.push('For best results, use Chrome/Edge with hardware acceleration enabled');
    recommendations.push('Close other tabs to free up system resources');
    
    return recommendations;
  }
}

export const videoGeneration = new LocalVideoGenerationService();