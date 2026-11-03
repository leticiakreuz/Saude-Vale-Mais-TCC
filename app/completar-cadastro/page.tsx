import Header from "@/componentes/Header";
import Footer from "@/componentes/Footer";
import FormularioCadastro from "@/componentes/cadastro/FormularioCadastro";
export default function CompletarCadastro() {
  return <div className="flex min-h-screen flex-col bg-[#F5F7FA]"><Header/><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8"><h1 className="text-3xl font-extrabold text-[#005F8F]">Complete seu cadastro</h1><p className="mb-6 mt-3 text-slate-600">Sua conta já está criada. Para usar os serviços, complete seus dados e confirme seu endereço em Blumenau.</p><section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"><FormularioCadastro/></section></main><Footer/></div>;
}
