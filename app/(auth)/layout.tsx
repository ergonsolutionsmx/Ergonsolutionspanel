import { Logo } from "@/components/brand/logo";
import { TarjetaAcceso } from "@/components/ui/sign-in-card-2";

/** Pantallas de acceso: fondo navy con luces de marca y tarjeta de vidrio oscuro. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#06142e] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1c3d] via-[#06142e] to-[#030b1c]" />
        <div className="absolute -top-40 left-1/2 h-[30rem] w-[44rem] -translate-x-1/2 rounded-full bg-ergon-blue/30 blur-[110px]" />
        <div className="absolute -bottom-48 right-[-10rem] h-[26rem] w-[26rem] rounded-full bg-ergon-sky/20 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>
      <TarjetaAcceso>
        <div className="mb-6 flex justify-center">
          <Logo tono="light" prioridad className="logo-entrada w-44" />
        </div>
        {children}
      </TarjetaAcceso>
    </main>
  );
}
