# ComfyUI Setup Guide for Text-to-Video Generation

This guide will help you set up ComfyUI locally to enable real AI video generation in your app.

## 🎯 Prerequisites

### System Requirements
- **GPU**: NVIDIA RTX 3060+ (8GB VRAM minimum, 12GB+ recommended)
- **RAM**: 16GB+ (32GB recommended)
- **Storage**: 50GB+ free space for models
- **OS**: Windows 10/11, Linux, or macOS

### Software Requirements
- **Python**: 3.10 or 3.11 (NOT 3.12+)
- **Git**: For cloning repositories
- **CUDA**: 11.8 or 12.1 (for NVIDIA GPUs)

## 📦 Installation Steps

### 1. Download ComfyUI

**Option A: Portable Windows Version (Recommended for Windows)**
```bash
# Download from: https://github.com/comfyanonymous/ComfyUI/releases
# Extract the ComfyUI_windows_portable.7z file
# Run run_nvidia_gpu.bat or run_cpu.bat
```

**Option B: Manual Installation (All Platforms)**
```bash
# Clone ComfyUI repository
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
```

### 2. Download Video Generation Models

Create the following folder structure in your ComfyUI directory:
```
ComfyUI/
├── models/
│   ├── checkpoints/          # Base models
│   ├── vae/                  # VAE models
│   ├── clip/                 # CLIP models
│   └── diffusion_models/     # Video-specific models
```

**Download Required Models:**

1. **Base Checkpoint** (Choose one):
   - [SDXL Base 1.0](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors) → `models/checkpoints/`
   - [SD 1.5](https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors) → `models/checkpoints/`

2. **Video Generation Models** (Choose one):

   **Mochi (High Quality)**:
   ```bash
   # Download Mochi model
   huggingface-cli download genmo/mochi-1-preview --local-dir models/diffusion_models/mochi/
   ```

   **LTX-Video (Fast)**:
   ```bash
   # Download LTX-Video model
   huggingface-cli download Lightricks/LTX-Video --local-dir models/diffusion_models/ltx-video/
   ```

   **Stable Video Diffusion**:
   - [SVD XT](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt/resolve/main/svd_xt.safetensors) → `models/checkpoints/`

### 3. Install Video Extensions

For advanced video generation, install these custom nodes:

```bash
cd ComfyUI/custom_nodes

# Video generation nodes
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
git clone https://github.com/Fannovel16/ComfyUI-Frame-Interpolation.git
git clone https://github.com/melMass/ComfyUI-Pickling.git

# Animation nodes
git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git
```

Install dependencies for custom nodes:
```bash
cd ComfyUI-VideoHelperSuite
pip install -r requirements.txt

cd ../ComfyUI-Frame-Interpolation
pip install -r requirements.txt
```

### 4. Launch ComfyUI

**Windows Portable:**
```bash
# Double-click run_nvidia_gpu.bat
# Or for CPU: run_cpu.bat
```

**Manual Installation:**
```bash
# Activate virtual environment first
python main.py

# For API access (required for our app):
python main.py --listen 0.0.0.0 --port 8188

# For low VRAM systems:
python main.py --lowvram

# For systems without GPU:
python main.py --cpu
```

### 5. Verify Installation

1. Open browser to `http://localhost:8188`
2. You should see the ComfyUI interface
3. Test API access: `http://localhost:8188/system_stats`

## 🔧 Configuration for Your App

### Enable API Access
Start ComfyUI with API enabled:
```bash
python main.py --listen 0.0.0.0 --port 8188
```

### Configure Your React App
Update your app's ComfyUI service URL if needed:
```typescript
// In src/services/comfyUIService.ts
const comfyUIService = new ComfyUIService('http://127.0.0.1:8188');
```

## 🎬 Test Video Generation

### Basic Text-to-Video Workflow

1. **Load a Base Model**: Drag "Load Checkpoint" node
2. **Add Text Prompts**: "CLIP Text Encode" nodes for positive/negative prompts
3. **Set Video Parameters**: Configure dimensions, frame count, FPS
4. **Generate**: Queue the prompt and wait for video output

### Example Prompts
- "A cat walking in a garden, cinematic style"
- "Ocean waves crashing on beach, sunset lighting"
- "Futuristic city with flying cars, cyberpunk aesthetic"

## 🚀 Performance Optimization

### For Better Performance:
```bash
# Use these launch arguments:
python main.py --highvram --preview-method auto

# For systems with 8GB VRAM:
python main.py --normalvram

# For 4-6GB VRAM:
python main.py --lowvram

# For very low VRAM (2-4GB):
python main.py --novram
```

### Model Settings:
- **Resolution**: Start with 512x512, increase gradually
- **Steps**: 15-25 for balance of quality/speed
- **Batch Size**: 1 for video generation
- **Frame Count**: 16-24 frames for short clips

## 🔧 Troubleshooting

### Common Issues:

**"CUDA out of memory"**
```bash
# Use lower VRAM mode:
python main.py --lowvram
# Or reduce model size/resolution
```

**"Module not found"**
```bash
# Reinstall dependencies:
pip install -r requirements.txt
```

**"API not responding"**
```bash
# Check if ComfyUI is running on correct port:
netstat -an | grep :8188
```

**"No video output"**
```bash
# Install video processing dependencies:
pip install opencv-python ffmpeg-python
```

### Model Download Issues:
```bash
# Use git lfs for large models:
git lfs install
git clone https://huggingface.co/model-name

# Or use huggingface-cli:
pip install huggingface-hub
huggingface-cli download model-name
```

## 📊 Resource Usage

### Typical Memory Requirements:
- **SDXL + Video**: 8-12GB VRAM
- **SD 1.5 + Video**: 4-8GB VRAM  
- **Mochi**: 12-16GB VRAM
- **LTX-Video**: 6-10GB VRAM

### Generation Times:
- **512x512, 16 frames**: 2-5 minutes (RTX 3080)
- **768x768, 24 frames**: 5-10 minutes (RTX 3080)
- **1024x1024, 30 frames**: 10-20 minutes (RTX 4090)

## ✅ Verification Checklist

Before using with your app, verify:

- [ ] ComfyUI loads without errors
- [ ] Web interface accessible at `http://localhost:8188`
- [ ] API responds to `/system_stats` endpoint
- [ ] At least one video model installed
- [ ] Test workflow generates video successfully
- [ ] Your React app can connect to ComfyUI API

## 🎯 Next Steps

Once ComfyUI is running:
1. Test the connection in your React app
2. Try generating your first video
3. Experiment with different models and settings
4. Create custom workflows for your specific needs

## 📞 Support

If you encounter issues:
- Check ComfyUI GitHub issues
- Join ComfyUI Discord community
- Review model-specific documentation
- Test with simpler workflows first

Your app is now ready to generate real AI videos! 🎬