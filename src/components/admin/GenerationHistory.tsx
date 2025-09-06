import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface GenerationHistoryProps {
  userId: string;
}

interface Generation {
  id: string;
  prompt: string;
  settings: any;
  video_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  generation_time?: number;
  created_at: string;
}

export const GenerationHistory = ({ userId }: GenerationHistoryProps) => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGenerations();
  }, [userId]);

  const fetchGenerations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setGenerations((data || []) as Generation[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch generation history: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const handleDownload = (videoUrl: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Generation History</h3>
          <p className="text-sm text-muted-foreground">
            View your recent video generations and their status
          </p>
        </div>
        <Button onClick={fetchGenerations} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prompt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {loading ? 'Loading...' : 'No generation history found.'}
                </TableCell>
              </TableRow>
            ) : (
              generations.map((generation) => (
                <TableRow key={generation.id}>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={generation.prompt}>
                      {generation.prompt}
                    </div>
                    {generation.error_message && (
                      <div className="text-sm text-destructive mt-1">
                        Error: {generation.error_message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(generation.status)}
                  </TableCell>
                  <TableCell>
                    {formatDuration(generation.generation_time)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(generation.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {generation.video_url && generation.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(generation.video_url, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(generation.video_url!)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </>
                      )}
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