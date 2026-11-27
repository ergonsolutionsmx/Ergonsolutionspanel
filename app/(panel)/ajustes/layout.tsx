import { Suspense } from "react";
import { Titulo } from "@/components/panel/titulo";
import { PestanasAjustes } from "@/components/ajustes/pestanas";

export default function AjustesLayout({ children }: LayoutProps<"/ajustes">) {
  return (
    <>
      <Titulo>Ajustes</Titulo>
      <Suspense fallback={<div className="mb-6 h-11" />}>
        <PestanasAjustes />
      </Suspense>
      {children}
    </>
  );
}
