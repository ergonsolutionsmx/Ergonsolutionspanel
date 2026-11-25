import { Suspense } from "react";
import type { Metadata } from "next";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-black text-ergon-navy">Entrar</h1>
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </>
  );
}
