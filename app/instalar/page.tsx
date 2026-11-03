import Cabecalho from "@/componentes/publico/Cabecalho";
import Rodape from "@/componentes/publico/Rodape";
import InstalarApp from "@/componentes/InstalarApp";
export default function Instalar() {
  return <div className="sv-public"><Cabecalho /><main id="conteudo" className="sv-container max-w-3xl! py-12">
    <h1 className="text-3xl font-extrabold text-[#005F8F]">Saúde Vale+ no celular</h1>
    <p className="mt-4 leading-7 text-slate-600">Adicione o aplicativo à tela inicial para abrir seus serviços com um toque.</p>
    <div className="mt-7 rounded-2xl bg-[#005F8F] p-6 text-white"><InstalarApp /></div>
    <div className="mt-8 space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-[#005F8F]">Android</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700"><li>Abra o site no Chrome.</li><li>Toque no menu ⋮.</li><li>Escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</li></ol></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-[#005F8F]">iPhone ou iPad</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700"><li>Abra o site no Safari.</li><li>Toque em Compartilhar.</li><li>Escolha “Adicionar à Tela de Início”.</li></ol></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-[#005F8F]">Computador</h2><p className="mt-3 leading-7 text-slate-700">No Chrome ou Edge, procure a opção de instalar o aplicativo na barra de endereços ou no menu do navegador.</p></section>
    </div>
    <p className="mt-7 text-sm leading-6 text-slate-600">A instalação depende do navegador. Os serviços precisam de internet. No celular, use o endereço publicado do projeto; o endereço 127.0.0.1 desta prévia funciona somente neste computador.</p>
  </main><Rodape /></div>;
}
