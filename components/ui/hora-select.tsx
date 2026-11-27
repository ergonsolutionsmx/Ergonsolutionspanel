import { NativeSelect } from "@/components/ui/native-select";

/** Horas de 5 en 5 minutos, con a. m. / p. m. en español. */
export const HORAS_5 = Array.from({ length: (24 * 60) / 5 }, (_, i) => {
  const h = Math.floor((i * 5) / 60);
  const m = (i * 5) % 60;
  const valor = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { valor, etiqueta: `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` };
});

export function HoraSelect({
  id,
  name,
  valor,
  onCambio,
  defaultValue,
  invalido,
  ...props
}: Omit<React.ComponentProps<typeof NativeSelect>, "onChange" | "value"> & {
  id: string;
  name: string;
  valor?: string;
  onCambio?: (v: string) => void;
  invalido?: boolean;
}) {
  return (
    <NativeSelect
      id={id}
      name={name}
      {...(valor !== undefined ? { value: valor, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onCambio?.(e.target.value) } : { defaultValue })}
      aria-invalid={invalido || undefined}
      {...props}
    >
      {HORAS_5.map((h) => (
        <option key={h.valor} value={h.valor}>
          {h.etiqueta}
        </option>
      ))}
    </NativeSelect>
  );
}
