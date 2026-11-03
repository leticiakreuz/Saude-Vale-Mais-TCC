export type TemaSaudeVale = "claro" | "escuro";
export type PreferenciasAcessibilidade = { tema: TemaSaudeVale; altoContraste: boolean; modoEssencial: boolean };
export const CHAVE_ACESSIBILIDADE = "saude-vale-acessibilidade-v1";
export const EVENTO_ACESSIBILIDADE = "saude-vale-acessibilidade-alterada";
export const PREFERENCIAS_PADRAO: PreferenciasAcessibilidade = { tema: "claro", altoContraste: false, modoEssencial: false };
export function lerPreferencias(): PreferenciasAcessibilidade {
  if (typeof window === "undefined") return PREFERENCIAS_PADRAO;
  try {
    const salvo = window.localStorage.getItem(CHAVE_ACESSIBILIDADE);
    if (!salvo) return { ...PREFERENCIAS_PADRAO, modoEssencial: window.localStorage.getItem("saude-vale-essencial") === "1" };
    const dados = JSON.parse(salvo) as Partial<PreferenciasAcessibilidade>;
    return { tema: dados.tema === "escuro" ? "escuro" : "claro", altoContraste: dados.altoContraste === true, modoEssencial: dados.modoEssencial === true };
  } catch { return PREFERENCIAS_PADRAO; }
}
export function aplicarPreferencias(p: PreferenciasAcessibilidade): void {
  if (typeof document === "undefined") return;
  const raiz = document.documentElement;
  raiz.dataset.svTema = p.tema;
  raiz.dataset.svContraste = p.altoContraste ? "alto" : "normal";
  raiz.dataset.svEssencial = p.modoEssencial ? "sim" : "nao";
  raiz.dataset.essencial = String(p.modoEssencial);
  raiz.style.colorScheme = p.tema === "escuro" ? "dark" : "light";
}
export function salvarPreferencias(p: PreferenciasAcessibilidade): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CHAVE_ACESSIBILIDADE, JSON.stringify(p)); window.localStorage.setItem("saude-vale-essencial", p.modoEssencial ? "1" : "0"); } catch { /* Continua funcionando nesta aba. */ }
  aplicarPreferencias(p);
  window.dispatchEvent(new Event(EVENTO_ACESSIBILIDADE));
}
