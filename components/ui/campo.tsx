import { CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";

/** Etiqueta + control, en columna. El error se muestra debajo del campo. */
export function Campo({ id, etiqueta, error, children }: { id: string; etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs font-bold text-error">
          <CircleAlert className="size-3.5" aria-hidden /> {error}
        </p>
      ) : null}
    </div>
  );
}

export function ErrorForm({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="rounded-xl border border-error/30 bg-error/[0.06] px-3 py-2 text-sm text-error">
      {mensaje}
    </p>
  );
}
