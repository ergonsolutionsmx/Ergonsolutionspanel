export function Titulo({ children, accion }: { children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-[1.75rem] font-black leading-tight tracking-tight text-ergon-navy">{children}</h1>
      {accion}
    </div>
  );
}

