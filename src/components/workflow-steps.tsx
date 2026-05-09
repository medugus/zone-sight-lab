import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, ShieldCheck, Ruler, Microscope, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, title: "Capture", url: "/capture", icon: Camera },
  { num: 2, title: "QC", url: "/qc-plate", icon: ShieldCheck },
  { num: 3, title: "Measure", url: "/measure", icon: Ruler },
  { num: 4, title: "Interpret", url: "/interpret", icon: Microscope },
  { num: 5, title: "Report", url: "/reports", icon: FileText },
] as const;

export function WorkflowSteps() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const activeIdx = STEPS.findIndex((s) => path.startsWith(s.url));

  return (
    <div className="border-b border-border/60 bg-card/30 px-6 py-3">
      <ol className="flex flex-wrap items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em]">
        {STEPS.map((step, i) => {
          const isActive = i === activeIdx;
          const isDone = activeIdx > -1 && i < activeIdx;
          const Icon = step.icon;
          return (
            <li key={step.url} className="flex items-center">
              <Link
                to={step.url}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors",
                  isActive && "bg-primary/10 text-primary",
                  !isActive && "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    isActive && "border-primary bg-primary text-primary-foreground shadow-[0_0_12px_var(--cyan-glow)]",
                    isDone && "border-success/60 bg-success/15 text-success",
                    !isActive && !isDone && "border-border text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="h-3 w-3" /> : step.num}
                </span>
                <Icon className="h-3 w-3 opacity-70" />
                <span>{step.title}</span>
              </Link>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1 h-px w-6",
                    i < activeIdx ? "bg-success/50" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
