import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

interface ModelManagerProps {
  userId: string;
}

interface Model {
  id: string;
  name: string;
  file_path: string;
  model_type: 'checkpoint' | 'lora' | 'controlnet' | 'vae' | 'upscaler';
  description?: string;
  file_size?: number;
  is_active: boolean;
  created_at: string;
}

export const ModelManager = ({ userId }: ModelManagerProps) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    file_path: string;
    model_type: Model['model_type'];
    description: string;
    is_active: boolean;
  }>({
    name: '',
    file_path: '',
    model_type: 'checkpoint',
    description: '',
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
  }, [userId]);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('comfyui_models')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModels((data || []) as Model[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch models: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingModel) {
        const { error } = await supabase
          .from('comfyui_models')
          .update(formData)
          .eq('id', editingModel.id);

        if (error) throw error;
        toast({ title: "Model updated successfully" });
      } else {
        const { error } = await supabase
          .from('comfyui_models')
          .insert({ ...formData, user_id: userId });

        if (error) throw error;
        toast({ title: "Model added successfully" });
      }

      setDialogOpen(false);
      setEditingModel(null);
      setFormData({
        name: '',
        file_path: '',
        model_type: 'checkpoint' as Model['model_type'],
        description: '',
        is_active: true,
      });
      fetchModels();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      file_path: model.file_path,
      model_type: model.model_type,
      description: model.description || '',
      is_active: model.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const { error } = await supabase
        .from('comfyui_models')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Model deleted successfully" });
      fetchModels();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    const gb = mb / 1024;
    return gb > 1 ? `${gb.toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Model Library</h3>
          <p className="text-sm text-muted-foreground">
            Manage your ComfyUI models and checkpoints
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchModels} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingModel ? 'Edit Model' : 'Add New Model'}
                </DialogTitle>
                <DialogDescription>
                  Configure your ComfyUI model settings
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Model Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_path">File Path</Label>
                  <Input
                    id="file_path"
                    value={formData.file_path}
                    onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_type">Model Type</Label>
                  <Select value={formData.model_type} onValueChange={(value: Model['model_type']) => setFormData({ ...formData, model_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkpoint">Checkpoint</SelectItem>
                      <SelectItem value="lora">LoRA</SelectItem>
                      <SelectItem value="controlnet">ControlNet</SelectItem>
                      <SelectItem value="vae">VAE</SelectItem>
                      <SelectItem value="upscaler">Upscaler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : editingModel ? 'Update Model' : 'Add Model'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>File Path</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No models found. Add your first model to get started.
                </TableCell>
              </TableRow>
            ) : (
              models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{model.model_type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm truncate max-w-xs">
                    {model.file_path}
                  </TableCell>
                  <TableCell>{formatFileSize(model.file_size)}</TableCell>
                  <TableCell>
                    <Badge variant={model.is_active ? "default" : "secondary"}>
                      {model.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(model)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(model.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};