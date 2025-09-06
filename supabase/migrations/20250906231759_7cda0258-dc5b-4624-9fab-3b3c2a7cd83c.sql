-- Create ComfyUI settings and models tables
CREATE TABLE public.comfyui_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  server_url TEXT NOT NULL DEFAULT 'http://localhost:8188',
  api_timeout INTEGER NOT NULL DEFAULT 30000,
  max_queue_size INTEGER NOT NULL DEFAULT 10,
  auto_retry BOOLEAN NOT NULL DEFAULT true,
  retry_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create ComfyUI models table
CREATE TABLE public.comfyui_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('checkpoint', 'lora', 'controlnet', 'vae', 'upscaler')),
  description TEXT,
  file_size BIGINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create generation history table
CREATE TABLE public.generation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  settings JSONB,
  video_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  generation_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.comfyui_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comfyui_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comfyui_settings
CREATE POLICY "Users can view their own settings" 
ON public.comfyui_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.comfyui_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.comfyui_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for comfyui_models
CREATE POLICY "Users can view their own models" 
ON public.comfyui_models 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own models" 
ON public.comfyui_models 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models" 
ON public.comfyui_models 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models" 
ON public.comfyui_models 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for generation_history
CREATE POLICY "Users can view their own generation history" 
ON public.generation_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation history" 
ON public.generation_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_comfyui_settings_updated_at
  BEFORE UPDATE ON public.comfyui_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comfyui_models_updated_at
  BEFORE UPDATE ON public.comfyui_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Create default ComfyUI settings
  INSERT INTO public.comfyui_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();