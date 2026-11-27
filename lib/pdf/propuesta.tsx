import "server-only";
import path from "node:path";
import { Document, Font, Image as ImagenPdf, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { conIva, type PropuestaParaCliente } from "@/lib/propuestas-tipos";
import { LOCALE, ZONA_HORARIA } from "@/lib/utils";

// Recursos dentro del repo (incluidos en el despliegue con outputFileTracingIncludes).
const RECURSOS = path.join(process.cwd(), "lib", "pdf", "recursos");

// Tipografía de marca. POR CONFIRMAR: Lato vs Archivo + IBM Plex Sans.
Font.register({
  family: "Lato",
  fonts: [
    { src: path.join(RECURSOS, "lato-latin-400-normal.woff"), fontWeight: 400 },
    { src: path.join(RECURSOS, "lato-latin-700-normal.woff"), fontWeight: 700 },
    { src: path.join(RECURSOS, "lato-latin-900-normal.woff"), fontWeight: 900 },
  ],
});
// No partir palabras con guiones.
Font.registerHyphenationCallback((palabra) => [palabra]);

const MARCA = {
  navy: "#06142e",
  navy2: "#0b1c3d",
  azul: "#1d3fb8",
  cielo: "#2e90df",
  fondo: "#F3F4F6",
  texto: "#0F172A",
  gris: "#475569",
  borde: "#E2E8F0",
};

const s = StyleSheet.create({
  pagina: { fontFamily: "Lato", fontSize: 10, color: MARCA.texto, paddingBottom: 56 },
  encabezado: {
    backgroundColor: MARCA.navy,
    paddingHorizontal: 40,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { width: 150 },
  datosFolio: { alignItems: "flex-end" },
  etiquetaBlanca: { color: MARCA.cielo, fontSize: 8, fontWeight: 700, letterSpacing: 1 },
  folio: { color: "#FFFFFF", fontSize: 16, fontWeight: 900, marginTop: 2 },
  fechaBlanca: { color: "#CBD5E1", fontSize: 9, marginTop: 4 },
  franja: { height: 4, backgroundColor: MARCA.azul },
  cuerpo: { paddingHorizontal: 40, paddingTop: 24 },
  titulo: { fontSize: 20, fontWeight: 900, color: MARCA.navy },
  subtitulo: { fontSize: 11, color: MARCA.gris, marginTop: 4 },
  vigencia: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: MARCA.fondo,
    borderLeftWidth: 3,
    borderLeftColor: MARCA.azul,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textoChico: { fontSize: 9, color: MARCA.gris },
  textoChicoFuerte: { fontSize: 9, fontWeight: 700, color: MARCA.navy },
  seccion: { marginTop: 20 },
  tituloSeccion: { fontSize: 11, fontWeight: 900, color: MARCA.azul, letterSpacing: 0.5, marginBottom: 6 },
  parrafo: { fontSize: 10, lineHeight: 1.5 },
  tabla: { marginTop: 8, borderWidth: 1, borderColor: MARCA.borde, borderRadius: 4 },
  filaEncabezado: { flexDirection: "row", backgroundColor: MARCA.navy, paddingVertical: 7, paddingHorizontal: 10 },
  celdaEncabezado: { color: "#FFFFFF", fontSize: 8, fontWeight: 700, letterSpacing: 0.5 },
  fila: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: MARCA.borde },
  colConcepto: { flex: 1, paddingRight: 10 },
  colPrecio: { width: 92, textAlign: "right" },
  conceptoTitulo: { fontSize: 10, fontWeight: 700, color: MARCA.navy },
  conceptoDesc: { fontSize: 8.5, color: MARCA.gris, marginTop: 3, lineHeight: 1.4 },
  precio: { fontSize: 10, fontWeight: 700 },
  porDefinir: { fontSize: 9, color: MARCA.gris },
  totales: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  cajaTotal: { width: 150, padding: 10, borderRadius: 4, marginLeft: 8 },
  totalEtiqueta: { fontSize: 8, fontWeight: 700, letterSpacing: 0.5 },
  totalValor: { fontSize: 15, fontWeight: 900, marginTop: 3 },
  nota: { marginTop: 18, fontSize: 8.5, color: MARCA.gris, lineHeight: 1.4 },
  pie: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: MARCA.borde,
    paddingTop: 8,
  },
});

const pesos = (n: number) => new Intl.NumberFormat(LOCALE, { style: "currency", currency: "MXN" }).format(n);
const fecha = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

function Precio({ valor, mensual = false }: { valor: number | null; mensual?: boolean }) {
  if (valor === null) return <Text style={[s.colPrecio, s.porDefinir]}>—</Text>;
  return (
    <Text style={[s.colPrecio, s.precio]}>
      {pesos(valor)}
      {mensual ? <Text style={s.porDefinir}> /mes</Text> : null}
    </Text>
  );
}

export function DocumentoPropuesta({ p }: { p: PropuestaParaCliente }) {
  const emitida = p.enviada_en ?? p.creado_en;
  const porDefinir = p.conceptos.some((c) => c.precio_instalacion === null && c.precio_mensual === null);
  const inst = conIva(p.total_instalacion, p.con_iva);
  const mens = conIva(p.total_mensual, p.con_iva);

  return (
    <Document title={`Propuesta ${p.folio} · Ergon Solutions`} author="Ergon Solutions" language="es-MX">
      <Page size="LETTER" style={s.pagina}>
        <View style={s.encabezado} fixed>
          <ImagenPdf src={path.join(RECURSOS, "logo-fondo-oscuro.png")} style={s.logo} />
          <View style={s.datosFolio}>
            <Text style={s.etiquetaBlanca}>PROPUESTA</Text>
            <Text style={s.folio}>{p.folio}</Text>
            <Text style={s.fechaBlanca}>{fecha(emitida)}</Text>
          </View>
        </View>
        <View style={s.franja} fixed />

        <View style={s.cuerpo}>
          <Text style={s.titulo}>Propuesta para {p.prospecto_nombre}</Text>
          {p.prospecto_negocio ? <Text style={s.subtitulo}>{p.prospecto_negocio}</Text> : null}

          <View style={s.vigencia}>
            <Text style={s.textoChico}>
              Fecha: <Text style={s.textoChicoFuerte}>{fecha(emitida)}</Text>
            </Text>
            <Text style={s.textoChico}>
              Vigencia:{" "}
              <Text style={s.textoChicoFuerte}>{p.vence_en ? `hasta el ${fecha(p.vence_en)}` : "30 días a partir del envío"}</Text>
            </Text>
          </View>

          {p.problema ? (
            <View style={s.seccion} wrap={false}>
              <Text style={s.tituloSeccion}>LO QUE DETECTAMOS</Text>
              <Text style={s.parrafo}>{p.problema}</Text>
            </View>
          ) : null}

          {p.solucion ? (
            <View style={s.seccion}>
              <Text style={s.tituloSeccion}>LO QUE PROPONEMOS</Text>
              <Text style={s.parrafo}>{p.solucion}</Text>
            </View>
          ) : null}

          <View style={s.seccion}>
            <Text style={s.tituloSeccion}>INVERSIÓN</Text>
            <View style={s.tabla}>
              <View style={s.filaEncabezado} fixed>
                <Text style={[s.celdaEncabezado, s.colConcepto]}>CONCEPTO</Text>
                <Text style={[s.celdaEncabezado, s.colPrecio]}>INSTALACIÓN</Text>
                <Text style={[s.celdaEncabezado, s.colPrecio]}>MENSUALIDAD</Text>
              </View>
              {p.conceptos.length === 0 ? (
                <View style={s.fila}>
                  <Text style={s.porDefinir}>Sin conceptos.</Text>
                </View>
              ) : (
                p.conceptos.map((c, i) => (
                  <View key={i} style={s.fila} wrap={false}>
                    <View style={s.colConcepto}>
                      <Text style={s.conceptoTitulo}>
                        {c.titulo}
                        {c.cantidad > 1 ? <Text style={s.porDefinir}> × {c.cantidad}</Text> : null}
                      </Text>
                      {c.descripcion ? <Text style={s.conceptoDesc}>{c.descripcion}</Text> : null}
                    </View>
                    <Precio valor={c.precio_instalacion === null ? null : c.precio_instalacion * c.cantidad} />
                    <Precio valor={c.precio_mensual === null ? null : c.precio_mensual * c.cantidad} mensual />
                  </View>
                ))
              )}
            </View>

            <View style={s.totales} wrap={false}>
              <View style={[s.cajaTotal, { backgroundColor: MARCA.fondo }]}>
                <Text style={[s.totalEtiqueta, { color: MARCA.gris }]}>INSTALACIÓN (PAGO ÚNICO)</Text>
                <Text style={[s.totalValor, { color: MARCA.navy }]}>{pesos(inst.total)}</Text>
                {p.con_iva ? <Text style={[s.textoChico, { marginTop: 2 }]}>{pesos(inst.subtotal)} + IVA {pesos(inst.iva)}</Text> : null}
              </View>
              <View style={[s.cajaTotal, { backgroundColor: MARCA.navy }]}>
                <Text style={[s.totalEtiqueta, { color: MARCA.cielo }]}>MENSUALIDAD</Text>
                <Text style={[s.totalValor, { color: "#FFFFFF" }]}>{pesos(mens.total)}</Text>
                {p.con_iva ? <Text style={[s.textoChico, { marginTop: 2, color: "#C9D6EA" }]}>{pesos(mens.subtotal)} + IVA {pesos(mens.iva)}</Text> : null}
              </View>
            </View>

            <Text style={s.nota}>
              Precios en pesos mexicanos (MXN). {p.con_iva ? "Los totales incluyen IVA (16%)." : "Precios sin IVA."}
              {porDefinir ? " Los conceptos marcados con — tienen precio por definir." : ""}
            </Text>
          </View>
        </View>

        <View style={s.pie} fixed>
          <Text style={s.textoChico}>Ergon Solutions · {p.folio}</Text>
          <Text style={s.textoChico} render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function generarPdfPropuesta(p: PropuestaParaCliente) {
  return renderToBuffer(<DocumentoPropuesta p={p} />);
}

export function nombreArchivoPdf(folio: string) {
  return `${folio} Propuesta Ergon Solutions.pdf`;
}
