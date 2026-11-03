export type NomeIcone = "agenda" | "medicamento" | "vacina" | "sus" | "seta" | "escudo" | "pessoas" | "simples" | "pessoa" | "casa" | "cartao" | "configuracoes" | "mensagem" | "celular" | "estetoscopio" | "crianca" | "dente" | "retorno" | "receita" | "historico";
const caminhos: Record<NomeIcone, string> = {
  estetoscopio: "M5 3v5a5 5 0 0 0 10 0V3M3 3h4m6 0h4m-7 10v3a5 5 0 0 0 10 0v-2m0-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  crianca: "M7 6a8 8 0 0 1 13 6 8 8 0 0 1-16 0 8 8 0 0 1 3-6Zm2-1c0-3 5-3 5 0 0 2-3 2-3 0M8 11h.01M16 11h.01m-7 4q3 3 6 0",
  dente: "M12 4C8 1 3 3 3 8c0 4 2 7 3 11 1 4 3 2 4-2l1-3h2l1 3c1 4 3 6 4 2 1-4 3-7 3-11 0-5-5-7-9-4Zm0 0 3 2",
  retorno: "m9 5-5 5 5 5m-5-5h10a6 6 0 0 1 0 12h-2",
  historico: "M3 12a9 9 0 1 0 2.64-6.36L3 8M3 3v5h5m4-1v5l3 2",
  receita: "M8 3H5v18h14V3h-3M8 2h8v4H8V2Zm0 8h4m-2-2v4m-2 4h8m-8 3h5",
  pessoa: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  casa: "m3 10 9-7 9 7v11h-6v-7H9v7H3V10Z",
  cartao: "M3 4h18v16H3V4Zm0 5h18M6 14h4m-4 3h6m4-3h2",
  configuracoes: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6",
  mensagem: "M3 3h18v14H8l-5 4V3Zm4 5h10M7 12h7",
  celular: "M6 2h12v20H6V2Zm0 4h12M6 18h12m-6 2h.01",
  agenda: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm3 10h3v3H8z",
  medicamento: "m8 16 8-8M5 19a5 5 0 0 1 0-7l7-7a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7 0Z",
  vacina: "M8 2h8M12 2v4M6 6h12M8 6v10l4 3 4-3V6M12 19v3M8 10h4M8 13h3",
  sus: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z",
  seta: "M4 12h16m-6-6 6 6-6 6",
  escudo: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
  pessoas: "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3m20 0v-3a4 4 0 0 0-3-4M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 0a4 4 0 0 1 0 8",
  simples: "M4 6h16M4 12h12M4 18h8",
};
export default function Icone({ nome, className = "h-6 w-6" }: { nome: NomeIcone; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={caminhos[nome]} /></svg>;
}
