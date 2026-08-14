import { cn } from "@/lib/utils";

export type AutosaveStatus = "saved" | "saving" | "error" | "idle";

const LABELS: Record<AutosaveStatus, string> = {
  idle: "Not saved",
  saved: "Saved",
  saving: "Saving",
  error: "Error",
};

type AutosaveIndicatorProps = {
  status: AutosaveStatus;
  className?: string;
};

export function AutosaveIndicator({
  status,
  className,
}: AutosaveIndicatorProps) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "text-xs",
        status === "error" ? "text-red-700" : "text-muted-foreground",
        className,
      )}
    >
      {LABELS[status]}
    </p>
  );
}
