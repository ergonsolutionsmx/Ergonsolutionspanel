import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Campo({
  etiqueta,
  ...props
}: React.ComponentProps<typeof Input> & { etiqueta: string; name: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={props.name}>{etiqueta}</Label>
      <Input id={props.name} required {...props} />
    </div>
  );
}

export function Aviso({ estado }: { estado?: { error?: string; ok?: string } }) {
  if (estado?.error)
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {estado.error}
      </p>
    );
  if (estado?.ok)
    return (
      <p role="status" className="rounded-md bg-blue-50 px-3 py-2 text-sm text-ergon-navy">
        {estado.ok}
      </p>
    );
  return null;
}
