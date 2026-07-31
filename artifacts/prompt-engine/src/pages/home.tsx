import { useState } from 'react';
import { useLocation } from 'wouter';
import { useListSessions, useCreateSession } from '@workspace/api-client-react';
import { getListSessionsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: sessions, isLoading } = useListSessions();
  const createSession = useCreateSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [situation, setSituation] = useState('');

  const handleCreate = async () => {
    if (!title.trim() || !situation.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please provide both title and situation.',
        variant: 'destructive',
      });
      return;
    }

    createSession.mutate(
      { data: { title: title.trim(), situation: situation.trim() } },
      {
        onSuccess: (session) => {
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          setDialogOpen(false);
          setTitle('');
          setSituation('');
          setLocation(`/sessions/${session.id}`);
        },
        onError: () => {
          toast({
            title: 'Failed to create session',
            description: 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 w-64 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            Prompt Reasoning Engine
          </h1>
          <p className="text-lg text-muted-foreground">
            Progressive prompt refinement through AI-powered iteration
          </p>
        </div>

        {/* Create button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="lg" 
              className="mb-8 gap-2 font-semibold"
              data-testid="button-create-session"
            >
              <Plus className="w-5 h-5" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-session">
            <DialogHeader>
              <DialogTitle>Create Reasoning Session</DialogTitle>
              <DialogDescription>
                Describe your goal or situation. The engine will generate and refine a prompt for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Product Launch Email"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-session-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="situation">Situation</Label>
                <Textarea
                  id="situation"
                  placeholder="Describe what you need the prompt to achieve..."
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  rows={5}
                  data-testid="input-session-situation"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreate} 
                disabled={createSession.isPending}
                data-testid="button-submit-session"
              >
                {createSession.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sessions list */}
        {sessions && sessions.length === 0 ? (
          <div className="border border-border rounded-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No sessions yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first reasoning session to start building better prompts through iterative refinement.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions?.map((session, idx) => (
              <button
                key={session.id}
                onClick={() => setLocation(`/sessions/${session.id}`)}
                className="w-full text-left bg-card border border-card-border rounded-lg p-6 hover:border-primary/40 transition-all group"
                style={{ animationDelay: `${idx * 50}ms` }}
                data-testid={`card-session-${session.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                      {session.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {session.situation}
                    </p>
                    {session.latestPrompt && (
                      <div className="bg-muted/50 border border-muted-border rounded p-3 mb-3">
                        <p className="text-xs font-mono text-muted-foreground line-clamp-2">
                          {session.latestPrompt}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{session.iterationCount} iteration{session.iterationCount !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
