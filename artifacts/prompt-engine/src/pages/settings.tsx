import { useState, useEffect } from 'react';
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Check, Zap, Brain, Sparkles, type LucideIcon } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

type ModelOption = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  recommended?: boolean;
};

const modelOptions: { group: string; models: ModelOption[] }[] = [
  {
    group: 'OpenAI — Thinking',
    models: [
      { value: 'o4-mini', label: 'o4-mini', description: 'Best for reasoning — thinks before answering', icon: Brain, recommended: true },
    ],
  },
  {
    group: 'OpenAI — General',
    models: [
      { value: 'gpt-5.6-terra', label: 'GPT-5.6 Terra', description: 'Best general-purpose model, fast & capable', icon: Sparkles },
      { value: 'gpt-5.6-luna', label: 'GPT-5.6 Luna', description: 'Cost-efficient, high volume', icon: Zap },
    ],
  },
  {
    group: 'Gemini',
    models: [
      { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', description: 'Most powerful Gemini model', icon: Sparkles },
      { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: 'Fast hybrid reasoning, great default', icon: Zap },
    ],
  },
];

const allModels = modelOptions.flatMap((g) => g.models);

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [model, setModel] = useState('o4-mini');

  useEffect(() => {
    if (settings) {
      setModel(settings.model);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(
      { data: { model } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: 'Settings saved', description: 'Model updated successfully.' });
        },
        onError: () => {
          toast({ title: 'Failed to save settings', description: 'Please try again.', variant: 'destructive' });
        },
      }
    );
  };

  const selectedModel = allModels.find((m) => m.value === model);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sessions
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Choose your AI model for prompt generation</p>
        </div>

        <div className="space-y-4">
          {/* AI Status */}
          <div className="bg-card border border-card-border rounded-lg p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">AI Connections</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">OAI</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">OpenAI</p>
                    <p className="text-xs text-muted-foreground">Via Replit AI Integration</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">GEM</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Gemini</p>
                    <p className="text-xs text-muted-foreground">Via Replit AI Integration</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </div>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-card border border-card-border rounded-lg p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Active Model</h2>

            <div className="space-y-3">
              <div>
                <Label htmlFor="model" className="sr-only">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model" data-testid="select-model" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((group) => (
                      <div key={group.group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {group.group}
                        </div>
                        {group.models.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.label}</span>
                              {option.recommended && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                  Recommended
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedModel && (
                <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50 border border-border">
                  <selectedModel.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedModel.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedModel.description}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="w-full"
                size="lg"
                data-testid="button-save-settings"
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Model'}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center px-4">
            All models run via Replit AI Integrations — no API keys required. Usage is billed to your Replit credits.
          </p>
        </div>
      </div>
    </div>
  );
}
