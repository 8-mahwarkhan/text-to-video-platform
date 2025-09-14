import { toast } from 'sonner';

interface ComfyUIConfig {
  serverUrl: string;
  clientId: string;
}

interface QueuePromptResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, any>;
}

interface WorkflowNode {
  inputs: Record<string, any>;
  class_type: string;
  _meta?: {
    title: string;
  };
}

interface ComfyUIWorkflow {
  [key: string]: WorkflowNode;
}

interface HistoryResponse {
  [promptId: string]: {
    prompt: any[];
    outputs: {
      [nodeId: string]: {
        videos?: Array<{
          filename: string;
          subfolder: string;
          type: string;
        }>;
        images?: Array<{
          filename: string;
          subfolder: string;
          type: string;
        }>;
      };
    };
  };
}

export class ComfyUIService {
  private config: ComfyUIConfig;
  private ws: WebSocket | null = null;
  private progressCallback: ((progress: number, status: string) => void) | null = null;

  constructor(serverUrl: string = 'http://localhost:8188') {
    this.config = {
      serverUrl,
      clientId: this.generateClientId()
    };
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async isServerAvailable(): Promise<boolean> {
    try {
      // Normalize the server URL to avoid double slashes
      const normalizedUrl = this.config.serverUrl.replace(/\/+$/, '');
      const response = await fetch(`${normalizedUrl}/system_stats`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('ComfyUI server availability check failed:', error);
      
      // Check if it's a CORS error specifically
      if (error instanceof TypeError && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
        // Try a simple no-cors request to see if server is running
        try {
          await fetch(`${this.config.serverUrl.replace(/\/+$/, '')}/system_stats`, {
            method: 'GET',
            mode: 'no-cors'
          });
          console.warn('ComfyUI server detected but CORS is blocking requests. Please configure CORS in ComfyUI.');
          throw new Error('CORS_ERROR');
        } catch (corsError) {
          console.warn('ComfyUI server may not be running or CORS is not configured');
        }
      }
      return false;
    }
  }

  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Normalize the server URL and construct WebSocket URL
      const normalizedUrl = this.config.serverUrl.replace(/\/+$/, '');
      const wsUrl = normalizedUrl.replace('http', 'ws') + `/ws?clientId=${this.config.clientId}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to ComfyUI WebSocket');
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.ws.onerror = () => {
        reject(new Error('Failed to connect to ComfyUI WebSocket'));
      };

      this.ws.onclose = () => {
        console.log('ComfyUI WebSocket connection closed');
      };
    });
  }

  private handleWebSocketMessage(data: any) {
    if (data.type === 'progress') {
      const progress = (data.data.value / data.data.max) * 100;
      this.progressCallback?.(progress, `Processing: ${data.data.value}/${data.data.max}`);
    } else if (data.type === 'executing') {
      if (data.data.node) {
        this.progressCallback?.(0, `Executing node: ${data.data.node}`);
      } else {
        this.progressCallback?.(100, 'Generation complete');
      }
    }
  }

  private createTextToVideoWorkflow(prompt: string, width: number = 512, height: number = 512): ComfyUIWorkflow {
    return {
      "1": {
        "inputs": {
          "text": prompt,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "2": {
        "inputs": {
          "text": "blurry, low quality, distorted",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Negative)"
        }
      },
      "3": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000),
          "steps": 20,
          "cfg": 7.0,
          "sampler_name": "euler",
          "scheduler": "normal",
          "positive": ["1", 0],
          "negative": ["2", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "KSampler"
        }
      },
      "4": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "Load Checkpoint"
        }
      },
      "5": {
        "inputs": {
          "width": width,
          "height": height,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": {
          "title": "Empty Latent Image"
        }
      },
      "6": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE Decode"
        }
      },
      "7": {
        "inputs": {
          "images": ["6", 0],
          "frame_rate": 10,
          "loop_count": 0,
          "filename_prefix": "ComfyUI_video",
          "format": "video/webm",
          "pix_fmt": "yuv420p",
          "crf": 20,
          "save_metadata": true
        },
        "class_type": "VHS_VideoCombine",
        "_meta": {
          "title": "Video Combine"
        }
      }
    };
  }

  async queuePrompt(workflow: ComfyUIWorkflow): Promise<string> {
    const normalizedUrl = this.config.serverUrl.replace(/\/+$/, '');
    const response = await fetch(`${normalizedUrl}/prompt`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: workflow,
        client_id: this.config.clientId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to queue prompt: ${response.statusText}`);
    }

    const data: QueuePromptResponse = await response.json();
    
    if (data.node_errors && Object.keys(data.node_errors).length > 0) {
      throw new Error(`Workflow errors: ${JSON.stringify(data.node_errors)}`);
    }

    return data.prompt_id;
  }

  async waitForCompletion(promptId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const normalizedUrl = this.config.serverUrl.replace(/\/+$/, '');
          const response = await fetch(`${normalizedUrl}/history/${promptId}`, {
            mode: 'cors'
          });
          
          if (!response.ok) {
            clearInterval(checkInterval);
            reject(new Error('Failed to check generation status'));
            return;
          }

          const history: HistoryResponse = await response.json();
          
          if (history[promptId]) {
            clearInterval(checkInterval);
            
            // Find video output
            const outputs = history[promptId].outputs;
            for (const nodeId in outputs) {
              const nodeOutput = outputs[nodeId];
              if (nodeOutput.videos && nodeOutput.videos.length > 0) {
                const video = nodeOutput.videos[0];
                const normalizedUrl = this.config.serverUrl.replace(/\/+$/, '');
                const videoUrl = `${normalizedUrl}/view?filename=${video.filename}&subfolder=${video.subfolder}&type=${video.type}`;
                resolve(videoUrl);
                return;
              }
            }
            
            reject(new Error('No video output found in generation results'));
          }
        } catch (error) {
          clearInterval(checkInterval);
          reject(error);
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Video generation timeout'));
      }, 300000);
    });
  }

  async generateVideo(
    prompt: string, 
    options: {
      width?: number;
      height?: number;
      onProgress?: (progress: number, status: string) => void;
    } = {}
  ): Promise<string> {
    const { width = 512, height = 512, onProgress } = options;
    
    this.progressCallback = onProgress || null;

    try {
      // Check if server is available
      const isAvailable = await this.isServerAvailable();
      if (!isAvailable) {
        throw new Error('ComfyUI server is not running. Please start ComfyUI first.');
      }

      // Connect to WebSocket for progress updates
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        await this.connectWebSocket();
      }

      onProgress?.(10, 'Creating workflow...');

      // Create workflow
      const workflow = this.createTextToVideoWorkflow(prompt, width, height);

      onProgress?.(20, 'Queueing generation...');

      // Queue the prompt
      const promptId = await this.queuePrompt(workflow);

      onProgress?.(30, 'Generation started...');

      // Wait for completion and get video URL
      const videoUrl = await this.waitForCompletion(promptId);

      onProgress?.(100, 'Video generation complete!');

      return videoUrl;

    } catch (error) {
      this.progressCallback = null;
      throw error;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const normalizedUrl = this.config.serverUrl.replace(/\/+$/, '');
      const response = await fetch(`${normalizedUrl}/object_info`, {
        mode: 'cors'
      });
      const data = await response.json();
      
      // Extract available checkpoints
      const checkpointLoader = data.CheckpointLoaderSimple;
      if (checkpointLoader && checkpointLoader.input && checkpointLoader.input.required && checkpointLoader.input.required.ckpt_name) {
        return checkpointLoader.input.required.ckpt_name[0] || [];
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.progressCallback = null;
  }
}

export const comfyUIService = new ComfyUIService();