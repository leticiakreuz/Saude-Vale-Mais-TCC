"use client";
import { useEffect,useState,type ReactNode } from "react";
import { usePathname,useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc,onSnapshot } from "firebase/firestore";
import { auth,db } from "@/app/firebase";
import { cadastroCompleto } from "@/lib/cadastro/validacao";
const protegidas=["/dashboard","/perfil","/agendamentos","/medicamentos","/vacinacao"];
export default function ExigirCadastroCompleto({children}:{children:ReactNode}) {
  const caminho=usePathname(),router=useRouter(),protegida=protegidas.includes(caminho);
  const [estado,setEstado]=useState<"carregando"|"permitido"|"bloqueado"|"erro">("carregando");
  useEffect(()=>{
    if(!protegida)return;
    setEstado("carregando");
    let desligar:(()=>void)|undefined,ativo=true;
    const cancelar=onAuthStateChanged(auth,usuario=>{
      desligar?.();
      if(!usuario){setEstado("bloqueado");router.replace("/login");return;}
      desligar=onSnapshot(doc(db,"usuarios",usuario.uid),p=>{
        if(!ativo)return;
        if(cadastroCompleto(p.data()))setEstado("permitido");
        else {setEstado("bloqueado");router.replace("/completar-cadastro");}
      },()=>{if(ativo)setEstado("erro");});
    });
    return()=>{ativo=false;cancelar();desligar?.();};
  },[protegida,router]);
  if(!protegida || estado==="permitido")return children;
  return <main className="mx-auto max-w-xl p-8 py-20"><p role={estado==="erro"?"alert":"status"} className="text-lg font-semibold text-[#005F8F]">{estado==="erro"?"Não foi possível validar seu cadastro. Confira sua conexão e recarregue a página.":estado==="bloqueado"?"Complete seu cadastro para continuar.":"Verificando seu cadastro…"}</p></main>;
}
