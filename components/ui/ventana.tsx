"use client";

import { useMedia } from "@/lib/use-media";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Ventana para formularios: Dialog en computadora y hoja desde abajo en celular. */
export function Ventana({
  abierta,
  onCambio,
  titulo,
  descripcion,
  children,
  ancho = "sm:max-w-2xl",
}: {
  abierta: boolean;
  onCambio: (v: boolean) => void;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  ancho?: string;
}) {
  const escritorio = useMedia("(min-width: 768px)");
  if (escritorio) {
    return (
      <Dialog open={abierta} onOpenChange={onCambio}>
        <DialogContent className={cn("max-h-[90dvh] overflow-y-auto", ancho)}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-ergon-navy">{titulo}</DialogTitle>
            <DialogDescription className={descripcion ? undefined : "sr-only"}>{descripcion ?? titulo}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={abierta} onOpenChange={onCambio}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-[1.75rem] border-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-ergon-navy/15" aria-hidden />
        <SheetHeader className="px-0 pb-0">
          <SheetTitle className="text-xl font-black text-ergon-navy">{titulo}</SheetTitle>
          <SheetDescription className={descripcion ? undefined : "sr-only"}>{descripcion ?? titulo}</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
