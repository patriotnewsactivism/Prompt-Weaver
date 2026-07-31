export function IterationSkeleton() {
  return (
    <div className="bg-card border border-card-border rounded-lg overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-card-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
      </div>
      
      <div className="px-6 py-5 space-y-4">
        <div>
          <div className="h-3 w-20 bg-muted rounded mb-2" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
        
        <div>
          <div className="h-3 w-16 bg-muted rounded mb-2" />
          <div className="bg-muted/50 border border-muted-border rounded p-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/5" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
