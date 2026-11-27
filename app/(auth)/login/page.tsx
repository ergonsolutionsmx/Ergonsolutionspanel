import { Suspense } from "react";
import type { Metadata } from "next";
import { FormularioLogin } from "./formulario";
import { EncabezadoAcceso } from "../campo";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <>
      <EncabezadoAcceso titulo="Bienvenido de nuevo" texto="Entra a Ergon Solutions" />
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </>
  );
}
