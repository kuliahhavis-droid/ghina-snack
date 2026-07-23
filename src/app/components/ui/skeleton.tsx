import { cn } from "./utils";

function Skeleton({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-slate-100/80 animate-pulse rounded-md", className)}
      style={{ animationDuration: '2.5s', ...style }}
      {...props}
    />
  );
}

export { Skeleton };
