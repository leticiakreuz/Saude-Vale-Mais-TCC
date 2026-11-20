"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
type EventoInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export default function InstalarApp({ className = "", instrucoesId }: { className?: string; instrucoesId?: string }) {
  const naPaginaDeInstalacao = usePathname() === "/instalar";
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
  if (naPaginaDeInstalacao && !instrucoesId) return null;

  return <div className={`flex flex-wrap items-center gap-3 ${className}`}>
    {instalado ? <p className="text-sm font-semibold">App instalado</p> : <>
      {evento && <button onClick={instalar} type="button" className="min-h-12 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#005F8F]">Instalar aplicativo</button>}
      {!evento && instrucoesId && <>
        <a href={`#${instrucoesId}`} className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#005F8F]">Instalar aplicativo</a>
        <p className="w-full text-sm">Siga os passos abaixo para instalar pelo menu do navegador.</p>
      </>}
      {!naPaginaDeInstalacao && <>
        {!evento && <Link href="/instalar" className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#005F8F]">Instalar aplicativo</Link>}
        <Link href="/instalar" className="py-3 text-sm underline underline-offset-4">Como instalar</Link>
      </>}
    </>}
    {erro && !instrucoesId && <p role="status" className="w-full text-sm">{erro}</p>}
  </div>;
}
