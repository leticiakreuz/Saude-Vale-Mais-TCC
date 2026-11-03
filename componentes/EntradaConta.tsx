"use client";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/firebase";
export default function EntradaConta({ profissional = false }: { profissional?: boolean }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [aguardando, setAguardando] = useState(true);
  useEffect(() => {
    let ativo = true;
    const cancelar = onAuthStateChanged(auth, async user => {
      if (!user) { if (ativo) setAguardando(false); return; }
      try {
        const token = await user.getIdToken(true);
        const resposta = await fetch("/api/acesso", { method: "POST", headers: { Authorization: "Bearer " + token } });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro);
        if (profissional && dados.destino === "/dashboard") throw new Error("Sua conta é de paciente. O acesso profissional deve ser autorizado pela administração da UBS.");
        if (ativo) router.replace(dados.destino);
      } catch (e) { if (ativo) { setErro(e instanceof Error ? e.message : "Não foi possível verificar seu acesso."); setAguardando(false); } }
    });
    return () => { ativo = false; cancelar(); };
  }, [router, profissional]);
  return <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8"><h1 className="text-3xl font-extrabold text-[#005F8F]">{profissional ? "Área do profissional" : "Acessar minha área"}</h1><p className="mt-4 leading-7 text-slate-600">{profissional ? "Entre com a conta autorizada pela sua UBS. Sua função define as ferramentas disponíveis." : "Entre para consultar os serviços da sua conta."}</p>{aguardando ? <p role="status" className="mt-6">Verificando seu acesso…</p> : <><p role="alert" className="mt-5 text-red-700">{erro}</p><Link href={profissional ? "/login?area=profissional" : "/login"} className="sv-button mt-6">Entrar com e-mail e senha</Link><Link href="/dashboard" className="mt-5 block text-[#005F8F] underline">Ir para a área do paciente</Link></>}</div>;
}
