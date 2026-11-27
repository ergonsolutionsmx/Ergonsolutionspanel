import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Select nativo (mejor en celular que uno hecho a mano). */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-input bg-card pl-3 pr-9 text-base outline-none focus-visible:border-ergon-blue focus-visible:ring-4 focus-visible:ring-ergon-blue/15 aria-invalid:border-error disabled:opacity-50 md:h-10 md:text-sm",
          className,
        )}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}

export { NativeSelect };
