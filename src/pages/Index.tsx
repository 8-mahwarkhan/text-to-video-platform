import { useAuth } from '@/contexts/AuthContext';
import VideoGenerator from '@/components/VideoGenerator';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="relative">
      {user && (
        <div className="absolute top-4 right-4 z-10">
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
        </div>
      )}
      <VideoGenerator />
    </div>
  );
};

export default Index;
