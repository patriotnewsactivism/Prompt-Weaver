import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGetSession, getGetSessionQueryKey, getListSessionsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IterationSkeleton } from '@/components/iteration-skeleton';
import { ArrowLeft, Sparkles, Copy, Check, Download } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const focusAreaOptions = [
  { value: 'clarity', label: 'Clarity' },
  { value: 'specificity', label: 'Specificity' },
  { value: 'tone', label: 'Tone' },
  { value: 'context', label: 'Context' },
  { value: 'constraints', label: 'Constraints' },
  { value: 'examples', label: 'Examples' },
  { value: 'format', label: 'Format' },
];

export default function Session() {
  const params = useParams();
  const sessionId = params.id ? Number(params.id) : null;
  const [, setLocation] = useLocation();
  
  const { data: session, isLoading } = useGetSession(sessionId!, {
    query: { enabled: !!sessionId, queryKey: getGetSessionQueryKey(sessionId!) },
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [userFeedback, setUserFeedback] = useState('');
  const [focusArea, setFocusArea] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingIteration, setStreamingIteration] = useState<{
    reasoning: string;
    prompt: string;
    phase: 'reasoning' | 'prompt' | 'done';
  } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [exported, setExported] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-generate first iteration
  useEffect(() => {
    if (session && session.iterationCount === 0 && !isGenerating) {
      handleGenerate();
    }
  }, [session?.id, session?.iterationCount]);

  // Scroll to bottom when new iteration starts
  useEffect(() => {
    if (streamingIteration) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingIteration]);

  const handleGenerate = async () => {
    if (!sessionId) return;
    
    setIsGenerating(true);
    setStreamingIteration({ reasoning: '', prompt: '', phase: 'reasoning' });

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/sessions/${sessionId}/iterate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userFeedback: userFeedback.trim() || null,
          focusArea: focusArea || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate iteration');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.done) {
              setStreamingIteration(prev => prev ? { ...prev, phase: 'done' } : null);
              queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(sessionId) });
              queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
              setUserFeedback('');
              setFocusArea('');
              setIsGenerating(false);
              setStreamingIteration(null);
            } else if (data.phase === 'reasoning') {
              setStreamingIteration(prev => ({
                reasoning: (prev?.reasoning || '') + data.content,
                prompt: prev?.prompt || '',
                phase: 'reasoning',
              }));
            } else if (data.phase === 'prompt') {
              setStreamingIteration(prev => ({
                reasoning: prev?.reasoning || '',
                prompt: (prev?.prompt || '') + data.content,
                phase: 'prompt',
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
      setIsGenerating(false);
      setStreamingIteration(null);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Prompt copied to clipboard' });
  };

  const handleExport = () => {
    if (!session) return;

    const lines: string[] = [];
    lines.push(`# ${session.title}`);
    lines.push('');
    lines.push(`**Situation:** ${session.situation}`);
    lines.push('');

    for (const iteration of session.iterations) {
      lines.push('---');
      lines.push('');
      const heading = iteration.focusArea
        ? `## Iteration ${iteration.iterationNumber} · ${iteration.focusArea}`
        : `## Iteration ${iteration.iterationNumber}`;
      lines.push(heading);
      lines.push('');
      lines.push('**Reasoning:**');
      lines.push('');
      lines.push(iteration.reasoning);
      lines.push('');
      lines.push('**Prompt:**');
      lines.push('');
      lines.push('```');
      lines.push(iteration.prompt);
      lines.push('```');
      lines.push('');
    }

    const markdown = lines.join('\n');
    navigator.clipboard.writeText(markdown);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
    toast({ title: 'Exported to clipboard', description: 'Full session copied as Markdown' });
  };

  if (!sessionId) {
    setLocation('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="h-4 w-24 bg-muted rounded mb-4" />
            <div className="h-8 w-64 bg-muted rounded mb-2" />
            <div className="h-5 w-96 bg-muted rounded" />
          </div>
          <div className="space-y-6">
            <IterationSkeleton />
            <IterationSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Session not found</h2>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to sessions
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground mb-2">{session.title}</h1>
              <p className="text-muted-foreground">{session.situation}</p>
            </div>
            {session.iterations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="shrink-0 gap-2 mt-1"
                data-testid="button-export"
              >
                {exported ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Exported!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export as Markdown
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Iterations */}
        <div className="space-y-6 mb-8">
          {session.iterations.map((iteration, idx) => (
            <div
              key={iteration.id}
              className="bg-card border border-card-border rounded-lg overflow-hidden animate-slide-up-fade"
              style={{ animationDelay: `${idx * 80}ms` }}
              data-testid={`iteration-${iteration.id}`}
            >
              <div className="px-6 py-4 border-b border-card-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">
                      Iteration {iteration.iterationNumber}
                    </span>
                    {iteration.focusArea && (
                      <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent font-medium border border-accent/20">
                        {iteration.focusArea}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(iteration.prompt, iteration.id)}
                    className="gap-2"
                    data-testid={`button-copy-${iteration.id}`}
                  >
                    {copiedId === iteration.id ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy prompt
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="px-6 py-5 space-y-4">
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold">
                    Reasoning
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {iteration.reasoning}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold">
                    Prompt
                  </h3>
                  <div className="bg-muted/50 border border-muted-border rounded p-4">
                    <p className="text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap">
                      {iteration.prompt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming iteration */}
          {streamingIteration && (
            <div className="bg-card border border-primary/40 rounded-lg overflow-hidden animate-glow-pulse">
              <div className="px-6 py-4 border-b border-card-border bg-primary/5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">
                    Iteration {session.iterationCount + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">Generating...</span>
                </div>
              </div>
              
              <div className="px-6 py-5 space-y-4">
                {streamingIteration.reasoning && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold">
                      Reasoning
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {streamingIteration.reasoning}
                      {streamingIteration.phase === 'reasoning' && (
                        <span className="inline-block w-1 h-4 bg-primary ml-1 typing-cursor" />
                      )}
                    </p>
                  </div>
                )}
                
                {streamingIteration.prompt && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold">
                      Prompt
                    </h3>
                    <div className="bg-muted/50 border border-muted-border rounded p-4">
                      <p className="text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap">
                        {streamingIteration.prompt}
                        {streamingIteration.phase === 'prompt' && (
                          <span className="inline-block w-1 h-4 bg-primary ml-1 typing-cursor" />
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>

        {/* Generate next iteration */}
        {!isGenerating && session.iterationCount > 0 && (
          <div className="bg-card border border-card-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Refine Further</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="What would you like to improve in the next iteration?"
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  rows={3}
                  data-testid="input-feedback"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="focus">Focus Area (optional)</Label>
                <Select value={focusArea} onValueChange={setFocusArea}>
                  <SelectTrigger id="focus" data-testid="select-focus-area">
                    <SelectValue placeholder="Choose an aspect to focus on" />
                  </SelectTrigger>
                  <SelectContent>
                    {focusAreaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full gap-2 font-semibold"
                size="lg"
                data-testid="button-generate"
              >
                <Sparkles className="w-5 h-5" />
                Generate Next Iteration
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
