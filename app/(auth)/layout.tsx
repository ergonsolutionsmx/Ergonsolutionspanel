import Image from "next/image";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Image
        src="/brand/logo-horizontal-claro.png"
        alt="Ergon Solutions"
        width={240}
        height={56}
        priority
        className="h-auto w-56"
      />
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">{children}</div>
    </main>
  );
}
