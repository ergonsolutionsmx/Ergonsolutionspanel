import { Suspense } from "react";
import { Titulo } from "@/components/panel/titulo";
import { PestanasAjustes } from "@/components/ajustes/pestanas";

export default function AjustesLayout({ children }: LayoutProps<"/ajustes">) {
  return (
    <>
      <Titulo>Ajustes</Titulo>
      <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
        <div className="md:sticky md:top-6 md:self-start md:border-r md:border-ergon-navy/10 md:pr-4">
          <Suspense fallback={<div className="h-11" />}>
            <PestanasAjustes />
          </Suspense>
        </div>
        <div className="min-w-0 max-w-3xl">{children}</div>
      </div>
    </>
  );
}
