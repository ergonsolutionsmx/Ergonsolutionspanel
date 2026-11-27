import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative rounded-xl border text-sm", {
  variants: {
    variant: {
      default: "border-border bg-card text-foreground",
      warning: "border-aviso/40 bg-aviso/[0.07] text-aviso",
      error: "border-error/40 bg-error/[0.06] text-error",
      success: "border-exito/40 bg-exito/[0.07] text-exito",
      info: "border-info/40 bg-info/[0.06] text-info",
    },
    size: {
      sm: "px-4 py-3",
      lg: "p-4",
    },
    isNotification: {
      true: "z-[100] w-full max-w-[400px] bg-popover shadow-lg",
      false: "",
    },
  },
  defaultVariants: { variant: "default", size: "sm", isNotification: false },
});

interface AlertProps extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
  action?: React.ReactNode;
  layout?: "row" | "complex";
}

function Alert({ className, variant, size, isNotification, icon, action, layout = "row", children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant, size, isNotification }), className)} {...props}>
      {layout === "row" ? (
        // Una sola línea
        <div className="flex items-center gap-2">
          <div className="flex grow items-center">
            {icon ? <span className="me-3 inline-flex">{icon}</span> : null}
            {children}
          </div>
          {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
        </div>
      ) : (
        // Varias líneas: título, texto y acciones
        <div className="flex gap-2">
          <div className="flex grow gap-3">
            {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
            <div className="grow">{children}</div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 className={cn("text-sm font-bold", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function AlertContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, AlertContent, alertVariants };
