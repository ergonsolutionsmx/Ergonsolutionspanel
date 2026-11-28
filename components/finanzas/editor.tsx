"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { cn, pesos } from "@/lib/utils";
import { hoyISO } from "@/lib/fechas";
import {
  CATEGORIAS,
  METODOS,
  calcularTotal,
  type Movimiento,
  type Recurrente,
  type TipoMovimiento,
} from "@/lib/finanzas-tipos";
import { borrarMovimiento, borrarRecurrente, descartarFactura, guardarMovimiento, guardarRecurrente, type EstadoForm } from "@/app/(panel)/finanzas/acciones";
import { Ventana } from "@/components/ui/ventana";
import { Segmentos } from "@/components/ui/segmentos";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { useConfirmar } from "@/components/ui/confirmar";
import { toast } from "@/components/avisos/toast";
import { SubirFactura } from "./subir-factura";

// ---------------------------------------------------------------------------
// Estado compartido: cualquier botón de la página abre el editor.
// ---------------------------------------------------------------------------
type Pedido =
  | { clase: "movimiento"; tipo: TipoMovimiento; movimiento?: Movimiento }
  | { clase: "recurrente"; tipo: TipoMovimiento; recurrente?: Recurrente }
  | null;
let pedido: Pedido = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());
const suscribir = (f: () => void) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

export const abrirMovimiento = (tipo: TipoMovimiento, movimiento?: Movimiento) => {
  pedido = { clase: "movimiento", tipo, movimiento };
  avisar();
};
export const abrirRecurrente = (tipo: TipoMovimiento, recurrente?: Recurrente) => {
  pedido = { clase: "recurrente", tipo, recurrente };
  avisar();
};
const cerrar = () => {
  pedido = null;
  avisar();
};

type Proyecto = { id: string; nombre: string };

/** Montado una vez en la página de Finanzas: muestra el formulario que se pidió. */
export function Editores({ proyectos, nuevo }: { proyectos: Proyecto[]; nuevo?: TipoMovimiento }) {
  const actual = useSyncExternalStore(suscribir, () => pedido, () => null);
  // "?nuevo=ingreso" (desde el buscador): abre el formulario al llegar.
  const abierto = useRef(false);
  useEffect(() => {
    if (nuevo && !abierto.current) {
      abierto.current = true;
      abrirMovimiento(nuevo);
    }
  }, [nuevo]);
  const clave = actual ? `${actual.clase}-${actual.tipo}-${actual.clase === "movimiento" ? (actual.movimiento?.id ?? "nuevo") : (actual.recurrente?.id ?? "nuevo")}` : "";
  return (
    <>
      {actual?.clase === "movimiento" ? <FormularioMovimiento key={clave} tipoInicial={actual.tipo} m={actual.movimiento} proyectos={proyectos} /> : null}
      {actual?.clase === "recurrente" ? <FormularioRecurrente key={clave} tipoInicial={actual.tipo} r={actual.recurrente} proyectos={proyectos} /> : null}
    </>
  );
}

const leerMonto = (v: string) => {
  const n = Number(v.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Campos comunes: concepto, cliente/proveedor, categoría, monto con IVA y proyecto. */
function CamposBase({
  tipo,
  datos,
  proyectos,
  subtotal,
  setSubtotal,
  conIva,
  setConIva,
}: {
  tipo: TipoMovimiento;
  datos?: { concepto: string; contraparte: string | null; categoria: string; proyecto_id: string | null; notas: string | null };
  proyectos: Proyecto[];
  subtotal: string;
  setSubtotal: (v: string) => void;
  conIva: boolean;
  setConIva: (v: boolean) => void;
}) {
  return (
    <>
      <input type="hidden" name="tipo" value={tipo} />
      <Campo id="concepto" etiqueta="Concepto">
        <Input id="concepto" name="concepto" defaultValue={datos?.concepto} required placeholder={tipo === "ingreso" ? "Ej. Anticipo sitio web" : "Ej. Suscripción de Vercel"} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="contraparte" etiqueta={tipo === "ingreso" ? "Cliente" : "Proveedor"}>
          <Input id="contraparte" name="contraparte" defaultValue={datos?.contraparte ?? ""} placeholder="Opcional" />
        </Campo>
        <Campo id="categoria" etiqueta="Categoría">
          <NativeSelect id="categoria" name="categoria" defaultValue={datos?.categoria ?? CATEGORIAS[tipo][0].clave} key={tipo}>
            {CATEGORIAS[tipo].map((c) => (
              <option key={c.clave} value={c.clave}>
                {c.nombre}
              </option>
            ))}
          </NativeSelect>
        </Campo>
      </div>
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <Campo id="subtotal" etiqueta="Monto (sin IVA)">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input id="subtotal" name="subtotal" inputMode="decimal" required value={subtotal} onChange={(e) => setSubtotal(e.target.value)} className="pl-7 tabular-nums" placeholder="0.00" />
          </div>
        </Campo>
        <label className="flex h-11 items-center justify-between gap-3 rounded-xl border border-input bg-card px-3 md:h-10">
          <span className="text-sm font-bold text-ergon-navy">Agregar IVA (16%)</span>
          <Switch checked={conIva} onCheckedChange={setConIva} />
          <input type="hidden" name="con_iva" value={conIva ? "true" : "false"} />
        </label>
      </div>
      {proyectos.length ? (
        <Campo id="proyecto_id" etiqueta="Proyecto (opcional)">
          <NativeSelect id="proyecto_id" name="proyecto_id" defaultValue={datos?.proyecto_id ?? ""}>
            <option value="">Sin proyecto</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </NativeSelect>
        </Campo>
      ) : null}
    </>
  );
}

function FormularioMovimiento({ tipoInicial, m, proyectos }: { tipoInicial: TipoMovimiento; m?: Movimiento; proyectos: Proyecto[] }) {
  const [abierta, setAbierta] = useState(true);
  const [tipo, setTipo] = useState<TipoMovimiento>(m?.tipo ?? tipoInicial);
  const [subtotal, setSubtotal] = useState(m ? String(m.subtotal) : "");
  const [conIva, setConIva] = useState(m ? m.tasa_iva > 0 : false);
  const [verRetenciones, setVerRetenciones] = useState(Boolean(m && (m.retencion_isr || m.retencion_iva)));
  const [isr, setIsr] = useState(m?.retencion_isr ? String(m.retencion_isr) : "");
  const [ivaRet, setIvaRet] = useState(m?.retencion_iva ? String(m.retencion_iva) : "");
  const [estado, setEstado] = useState<"pendiente" | "pagado">(m?.estado === "pagado" ? "pagado" : m ? "pendiente" : "pagado");
  const [fecha, setFecha] = useState(m?.fecha ?? hoyISO());
  const [vence, setVence] = useState(m?.vence ?? "");
  const [pagadoEn, setPagadoEn] = useState(m?.pagado_en ?? hoyISO());
  const [archivo, setArchivo] = useState(m?.factura_archivo ?? "");
  const [confirmar, ventanaConfirmar] = useConfirmar();
  const guardado = useRef(false);

  const { iva, total } = calcularTotal(leerMonto(subtotal), conIva, leerMonto(isr), leerMonto(ivaRet));

  // Al cerrar sin guardar, se borra la factura recién subida (no la que ya tenía).
  const salir = (v: boolean) => {
    if (v) return;
    if (!guardado.current && archivo && archivo !== (m?.factura_archivo ?? "")) void descartarFactura(archivo);
    setAbierta(false);
    window.setTimeout(cerrar, 200);
  };

  const [res, accion, enviando] = useActionState(async (previo: EstadoForm, fd: FormData) => {
    const r = await guardarMovimiento(previo, fd);
    if (r?.ok) {
      guardado.current = true;
      toast.success(r.ok);
      salir(false);
    }
    return r;
  }, undefined);

  const borrar = async () => {
    if (!m) return;
    if (!(await confirmar("¿Borrar este movimiento?", { texto: "También se borra su factura. No se puede deshacer.", accion: "Borrar" }))) return;
    const r = await borrarMovimiento(m.id);
    if (r.ok) {
      guardado.current = true;
      toast.success("Movimiento borrado");
      salir(false);
    } else toast.error("No se pudo borrar");
  };

  return (
    <Ventana abierta={abierta} onCambio={salir} titulo={m ? `Editar ${tipo}` : tipo === "ingreso" ? "Nuevo ingreso" : "Nuevo gasto"}>
      <form action={accion} className="grid gap-4 pt-2">
        {m ? <input type="hidden" name="id" value={m.id} /> : null}
        {!m ? (
          <Segmentos
            etiqueta="Tipo"
            activo={tipo}
            onCambio={(v) => setTipo(v as TipoMovimiento)}
            opciones={[
              { valor: "ingreso", etiqueta: "Ingreso" },
              { valor: "gasto", etiqueta: "Gasto" },
            ]}
            className="w-fit"
          />
        ) : null}

        <CamposBase tipo={tipo} datos={m} proyectos={proyectos} subtotal={subtotal} setSubtotal={setSubtotal} conIva={conIva} setConIva={setConIva} />

        <div>
          <button
            type="button"
            onClick={() => setVerRetenciones((v) => !v)}
            className="flex items-center gap-1 text-sm font-bold text-primary"
            aria-expanded={verRetenciones}
          >
            <ChevronDown className={cn("size-4 transition-transform", verRetenciones && "rotate-180")} aria-hidden />
            {verRetenciones ? "Retenciones" : "Agregar retenciones (opcional)"}
          </button>
          {verRetenciones ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Campo id="retencion_isr" etiqueta="ISR retenido">
                <Input id="retencion_isr" name="retencion_isr" inputMode="decimal" value={isr} onChange={(e) => setIsr(e.target.value)} placeholder="0.00" className="tabular-nums" />
              </Campo>
              <Campo id="retencion_iva" etiqueta="IVA retenido">
                <Input id="retencion_iva" name="retencion_iva" inputMode="decimal" value={ivaRet} onChange={(e) => setIvaRet(e.target.value)} placeholder="0.00" className="tabular-nums" />
              </Campo>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Cuando una empresa te paga, a veces retiene una parte. Escríbela aquí para que el total sea lo que de verdad llega.
              </p>
            </div>
          ) : null}
        </div>

        {/* Total en vivo */}
        <div className="flex items-center justify-between rounded-2xl bg-ergon-navy/[0.05] px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]">
          <span className="text-sm text-muted-foreground">
            {conIva ? `IVA ${pesos(iva)} · ` : ""}
            {tipo === "ingreso" ? "Total a recibir" : "Total a pagar"}
          </span>
          <span className="text-xl font-black tabular-nums text-ergon-navy">{pesos(Math.max(0, total))}</span>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-bold">Estado</span>
          <Segmentos
            etiqueta="Estado"
            activo={estado}
            onCambio={(v) => setEstado(v as "pendiente" | "pagado")}
            opciones={[
              { valor: "pagado", etiqueta: tipo === "ingreso" ? "Ya se cobró" : "Ya se pagó" },
              { valor: "pendiente", etiqueta: tipo === "ingreso" ? "Por cobrar" : "Por pagar" },
            ]}
            className="w-fit"
          />
          <input type="hidden" name="estado" value={estado} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="fecha" etiqueta="Fecha">
            <DatePicker id="fecha" name="fecha" valor={fecha} onCambio={setFecha} />
          </Campo>
          {estado === "pendiente" ? (
            <Campo id="vence" etiqueta="Fecha límite">
              <DatePicker id="vence" name="vence" valor={vence} onCambio={setVence} placeholder="Sin fecha límite" opcional />
            </Campo>
          ) : (
            <Campo id="pagado_en" etiqueta={tipo === "ingreso" ? "Se cobró el" : "Se pagó el"}>
              <DatePicker id="pagado_en" name="pagado_en" valor={pagadoEn} onCambio={setPagadoEn} />
            </Campo>
          )}
        </div>
        {estado === "pagado" ? (
          <Campo id="metodo" etiqueta="Método de pago">
            <NativeSelect id="metodo" name="metodo" defaultValue={m?.metodo ?? "transferencia"}>
              {METODOS.map((x) => (
                <option key={x.valor} value={x.valor}>
                  {x.nombre}
                </option>
              ))}
            </NativeSelect>
          </Campo>
        ) : null}

        <div className="grid gap-3 rounded-2xl border border-white/50 p-3 sm:p-4">
          <span className="text-sm font-bold">Factura</span>
          <Input name="factura_folio" defaultValue={m?.factura_folio ?? ""} placeholder="Folio o UUID (opcional)" aria-label="Folio de la factura" />
          <SubirFactura ruta={archivo} onCambio={setArchivo} />
        </div>

        <Campo id="notas" etiqueta="Notas">
          <Textarea id="notas" name="notas" defaultValue={m?.notas ?? ""} rows={2} placeholder="Opcional" />
        </Campo>

        <ErrorForm mensaje={res?.error} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {m ? (
            <Button type="button" variant="ghost" onClick={borrar} className="text-error hover:bg-error/10 hover:text-error">
              <Trash2 /> Borrar
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
      {ventanaConfirmar}
    </Ventana>
  );
}

function FormularioRecurrente({ tipoInicial, r, proyectos }: { tipoInicial: TipoMovimiento; r?: Recurrente; proyectos: Proyecto[] }) {
  const [abierta, setAbierta] = useState(true);
  const [tipo, setTipo] = useState<TipoMovimiento>(r?.tipo ?? tipoInicial);
  const [subtotal, setSubtotal] = useState(r ? String(r.subtotal) : "");
  const [conIva, setConIva] = useState(r ? r.tasa_iva > 0 : false);
  const [frecuencia, setFrecuencia] = useState(r?.frecuencia ?? "mensual");
  const [proxima, setProxima] = useState(r?.proxima ?? hoyISO());
  const [confirmar, ventanaConfirmar] = useConfirmar();
  const { total } = calcularTotal(leerMonto(subtotal), conIva);

  const salir = (v: boolean) => {
    if (v) return;
    setAbierta(false);
    window.setTimeout(cerrar, 200);
  };
  const [res, accion, enviando] = useActionState(async (previo: EstadoForm, fd: FormData) => {
    const r = await guardarRecurrente(previo, fd);
    if (r?.ok) {
      toast.success(r.ok);
      salir(false);
    }
    return r;
  }, undefined);

  const borrar = async () => {
    if (!r) return;
    if (!(await confirmar("¿Borrar este recurrente?", { texto: "Los movimientos que ya generó se quedan.", accion: "Borrar" }))) return;
    const x = await borrarRecurrente(r.id);
    if (x.ok) {
      toast.success("Recurrente borrado");
      salir(false);
    } else toast.error("No se pudo borrar");
  };

  return (
    <Ventana abierta={abierta} onCambio={salir} titulo={r ? "Editar recurrente" : "Nuevo recurrente"} descripcion="Cada periodo se crea solo un movimiento pendiente en esta fecha.">
      <form action={accion} className="grid gap-4 pt-2">
        {r ? <input type="hidden" name="id" value={r.id} /> : null}
        <Segmentos
          etiqueta="Tipo"
          activo={tipo}
          onCambio={(v) => setTipo(v as TipoMovimiento)}
          opciones={[
            { valor: "ingreso", etiqueta: "Cobro recurrente" },
            { valor: "gasto", etiqueta: "Gasto fijo" },
          ]}
          className="w-fit"
        />
        <CamposBase tipo={tipo} datos={r} proyectos={proyectos} subtotal={subtotal} setSubtotal={setSubtotal} conIva={conIva} setConIva={setConIva} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <span className="text-sm font-bold">Se repite</span>
            <Segmentos
              etiqueta="Frecuencia"
              activo={frecuencia}
              onCambio={(v) => setFrecuencia(v as "mensual" | "anual")}
              opciones={[
                { valor: "mensual", etiqueta: "Cada mes" },
                { valor: "anual", etiqueta: "Cada año" },
              ]}
              className="w-fit"
            />
            <input type="hidden" name="frecuencia" value={frecuencia} />
          </div>
          <Campo id="proxima" etiqueta={r ? "Próxima fecha" : "Primera fecha"}>
            <DatePicker id="proxima" name="proxima" valor={proxima} onCambio={setProxima} />
          </Campo>
        </div>
        <p className="text-xs text-muted-foreground">Si eliges un día después del 28, se usa el 28 para que exista en todos los meses.</p>
        <div className="flex items-center justify-between rounded-2xl bg-ergon-navy/[0.05] px-4 py-3">
          <span className="text-sm text-muted-foreground">{frecuencia === "anual" ? "Cada año" : "Cada mes"}</span>
          <span className="text-xl font-black tabular-nums text-ergon-navy">{pesos(total)}</span>
        </div>
        <ErrorForm mensaje={res?.error} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {r ? (
            <Button type="button" variant="ghost" onClick={borrar} className="text-error hover:bg-error/10 hover:text-error">
              <Trash2 /> Borrar
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
      {ventanaConfirmar}
    </Ventana>
  );
}
