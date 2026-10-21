"use client";

import { useEffect, useRef } from "react";

type ToastTipo = "success" | "error" | "info";

type ToastProps = {
  message: string;
  type: ToastTipo;
  onClose: () => void;
  duration?: number;
};

export default function Toast({
  message,
  type,
  onClose,
  duration = 4000,
}: ToastProps) {
  const fecharRef = useRef(onClose);

  useEffect(() => {
    fecharRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!message) return;

    const temporizador = window.setTimeout(() => {
      fecharRef.current();
    }, duration);

    return () => window.clearTimeout(temporizador);
  }, [message, duration]);

  if (!message) return null;

  const estilos = {
    success: {
      caixa: "border-green-200 bg-white",
      icone: "bg-green-100 text-green-700",
      simbolo: "✓",
    },
    error: {
      caixa: "border-red-200 bg-white",
      icone: "bg-red-100 text-red-700",
      simbolo: "!",
    },
    info: {
      caixa: "border-[#8ED3F5] bg-white",
      icone: "bg-[#8ED3F5]/30 text-[#005F8F]",
      simbolo: "i",
    },
  };

  const estilo = estilos[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-2xl border p-4 shadow-xl ${estilo.caixa}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${estilo.icone}`}
        aria-hidden="true"
      >
        {estilo.simbolo}
      </span>

      <p className="flex-1 pt-1 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]">
        {message}
      </p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar notificação"
        className="rounded-lg px-2 py-1 text-lg text-[#111827]/50 transition hover:bg-[#F5F7FA] hover:text-[#111827]"
      >
        ×
      </button>
    </div>
  );
}