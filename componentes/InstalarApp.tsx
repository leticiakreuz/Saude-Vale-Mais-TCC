"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type EventoInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export default function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [erro, setErro] = useState("");
  useEffect(() => {
    const capturar = (e: Event) => { e.preventDefault(); setEvento(e as EventoInstalacao); };
    const concluir = () => { setInstalado(true); setEvento(null); };
    setInstalado(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    window.addEventListener("beforeinstallprompt", capturar); window.addEventListener("appinstalled", concluir);
    return () => { window.removeEventListener("beforeinstallprompt", capturar); window.removeEventListener("appinstalled", concluir); };
  }, []);
  async function instalar() {
    if (!evento) return;
    try { await evento.prompt(); const resposta = await evento.userChoice; if (resposta.outcome === "accepted") setInstalado(true); setEvento(null); }
    catch { setErro("Veja as instruções para instalar pelo navegador."); setEvento(null); }
  }
  return <div className="flex flex-wrap items-center gap-3">
    {instalado ? <p className="text-sm font-semibold">App instalado</p> : <>{evento ? <button onClick={instalar} type="button" className="min-h-12 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#005F8F]">Instalar aplicativo</button> : <Link href="/instalar" className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#005F8F]">Instalar aplicativo</Link>}<Link href="/instalar" className="py-3 text-sm underline underline-offset-4">Como instalar</Link></>}
    {erro && <p role="status" className="w-full text-sm">{erro}</p>}
  </div>;
}
