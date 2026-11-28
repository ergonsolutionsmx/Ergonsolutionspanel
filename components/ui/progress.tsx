"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

/** Barra de avance que se llena al aparecer. */
function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/15", className)}
      value={v}
      {...props}
    >
      <ProgressPrimitive.Indicator asChild>
        <m.div
          data-slot="progress-indicator"
          className="h-full w-full rounded-full bg-gradient-to-r from-ergon-blue to-ergon-sky"
          initial={{ x: "-100%" }}
          animate={{ x: `-${100 - v}%` }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
