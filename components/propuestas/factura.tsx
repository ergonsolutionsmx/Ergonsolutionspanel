import { cn, pesos } from "@/lib/utils";
import { conIva, hayPreciosPorDefinir, type PropuestaParaCliente } from "@/lib/propuestas-tipos";

/** Servicios y totales con estilo de factura (Revisión y página del cliente). */
export function Factura({ p, className }: { p: PropuestaParaCliente; className?: string }) {
  const inst = conIva(p.total_instalacion, p.con_iva);
  const mens = conIva(p.total_mensual, p.con_iva);
  const porDefinir = hayPreciosPorDefinir(p.conceptos);
  return (
    <div className={cn("overflow-hidden rounded-[1.25rem] border border-white/70 bg-card shadow-sm", className)}>
      <table className="w-full text-sm">
        <caption className="sr-only">Servicios de la propuesta</caption>
        <thead>
          <tr className="border-b bg-ergon-navy text-left text-xs font-bold uppercase tracking-wide text-white">
            <th scope="col" className="px-4 py-3">
              Servicio
            </th>
            <th scope="col" className="hidden px-2 py-3 text-center sm:table-cell">
              Cant.
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Instalación
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Mensual
            </th>
          </tr>
        </thead>
        <tbody>
          {p.conceptos.map((c, i) => (
            <tr key={i} className="border-b align-top last:border-b-0">
              <td className="px-4 py-3">
                <p className="font-bold text-ergon-navy">
                  {c.titulo}
                  {c.cantidad > 1 ? <span className="font-normal text-muted-foreground sm:hidden"> × {c.cantidad}</span> : null}
                </p>
                {c.descripcion ? <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">{c.descripcion}</p> : null}
              </td>
              <td className="hidden px-2 py-3 text-center tabular-nums sm:table-cell">{c.cantidad}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {c.precio_instalacion === null ? <span className="text-muted-foreground">Por definir</span> : pesos(c.precio_instalacion * c.cantidad)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {c.precio_mensual === null ? <span className="text-muted-foreground">—</span> : pesos(c.precio_mensual * c.cantidad)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid gap-px border-t bg-border sm:grid-cols-2">
        {[
          { nombre: "Instalación (pago único)", t: inst, oscuro: false },
          { nombre: "Mensualidad", t: mens, oscuro: true },
        ].map(({ nombre, t, oscuro }) => (
          <dl key={nombre} className={cn("space-y-1 p-4 text-sm", oscuro ? "bg-ergon-navy text-white" : "bg-card")}>
            <dt className={cn("text-xs font-bold uppercase tracking-wide", oscuro ? "text-ergon-sky" : "text-muted-foreground")}>{nombre}</dt>
            <dd className="flex justify-between">
              <span className={oscuro ? "text-white/70" : "text-muted-foreground"}>Subtotal</span>
              <span className="tabular-nums">{pesos(t.subtotal)}</span>
            </dd>
            <dd className="flex justify-between">
              <span className={oscuro ? "text-white/70" : "text-muted-foreground"}>IVA {p.con_iva ? "16%" : "(no incluido)"}</span>
              <span className="tabular-nums">{p.con_iva ? pesos(t.iva) : "—"}</span>
            </dd>
            <dd className="flex items-baseline justify-between border-t border-current/10 pt-1">
              <span className="font-bold">Total</span>
              <span className="text-xl font-black tabular-nums">{pesos(t.total)}</span>
            </dd>
          </dl>
        ))}
      </div>
      {porDefinir ? <p className="border-t px-4 py-2 text-xs text-muted-foreground">Algunos precios están por definir y no se suman al total.</p> : null}
    </div>
  );
}
