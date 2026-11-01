/**
 * Saúde Vale+ — regras DIDÁTICAS da carteirinha.
 * Não é um motor de decisão clínica ou de comprovação oficial.
 * Para uso real, os esquemas devem ser mantidos pelo serviço de saúde e
 * validados conforme o calendário PNI vigente e as condições individuais.
 * Referência de pesquisa: https://www.gov.br/saude/pt-br/vacinacao/calendario
 */
export type FaseVacinal =
    | "Crianca"
    | "Adolescente"
    | "Adulto"
    | "Idoso"
    | "Gestante";

export type PeriodoGestacao = "atual" | "anterior";

export interface PerfilVacinal {
    nome?: string;
    dataNascimento?: string;
    gestanteAtual?: boolean;
    jaFoiGestante?: boolean;
    semanasGestacao?: number;
    inicioGestacao?: string;
}

export interface RegistroVacinal {
    id: string;
    codigo?: string;
    vacina: string;
    dose: string;
    dataAplicacao: string;
    dataPrevista: string;
    lote: string;
    unidade: string;
    status: string;
    fase?: FaseVacinal;
    periodoGestacao?: PeriodoGestacao;
    anoGestacao?: string;
}

export interface VacinaCatalogo {
    codigo: string;
    nome: string;
    aliases: string[];
}

export const VACINAS: VacinaCatalogo[] = [
    { codigo: "bcg", nome: "BCG", aliases: ["bcg"] },
    { codigo: "hepatite-b", nome: "Hepatite B", aliases: ["hepatite b", "hepatite-b", "hb"] },
    { codigo: "penta", nome: "Pentavalente (DTP/Hib/HB)", aliases: ["penta", "pentavalente", "dtp hib hb"] },
    { codigo: "vip", nome: "Poliomielite (VIP/VOP)", aliases: ["vip", "vop", "vip/vop", "poliomielite", "polio"] },
    { codigo: "rotavirus", nome: "Rotavírus", aliases: ["rotavirus", "rotavirus humano"] },
    { codigo: "pneumo", nome: "Pneumocócica conjugada", aliases: ["pneumococica", "pneumococica 10v", "pneumococica 20v", "pneumococica conjugada"] },
    { codigo: "meningococica-c", nome: "Meningocócica C", aliases: ["meningococica c", "meningo c"] },
    { codigo: "meningococica-acwy", nome: "Meningocócica ACWY", aliases: ["meningococica acwy", "meningo acwy"] },
    { codigo: "febre-amarela", nome: "Febre amarela", aliases: ["febre amarela"] },
    { codigo: "triplice-viral", nome: "Tríplice viral (SCR)", aliases: ["triplice viral", "scr", "sarampo caxumba rubeola"] },
    { codigo: "hepatite-a", nome: "Hepatite A", aliases: ["hepatite a"] },
    { codigo: "varicela", nome: "Varicela", aliases: ["varicela", "catapora", "tetra viral", "tetraviral"] },
    { codigo: "dtp", nome: "DTP", aliases: ["dtp", "triplice bacteriana"] },
    { codigo: "dt", nome: "dT (dupla adulto)", aliases: ["dt", "dupla adulto", "difteria tetano"] },
    { codigo: "dtpa", nome: "dTpa", aliases: ["dtpa", "triplice bacteriana acelular"] },
    { codigo: "hpv", nome: "HPV", aliases: ["hpv", "hpv4"] },
    { codigo: "dengue", nome: "Dengue", aliases: ["dengue", "dengue tetravalente"] },
    { codigo: "influenza", nome: "Influenza (gripe)", aliases: ["influenza", "gripe", "influenza trivalente"] },
    { codigo: "covid", nome: "Covid-19", aliases: ["covid", "covid 19", "covid-19", "coronavirus"] },
    { codigo: "vsr", nome: "Vírus sincicial respiratório (VSR)", aliases: ["vsr", "virus sincicial respiratorio"] },
    { codigo: "pneumo-23", nome: "Pneumocócica 23-valente (grupos específicos)", aliases: ["pneumococica 23", "pneumo 23", "pneumococica 23 valente"] },
];

export const CATALOGO_POR_FASE: Record<FaseVacinal, string[]> = {
    Crianca: ["bcg", "hepatite-b", "penta", "vip", "rotavirus", "pneumo", "meningococica-c", "meningococica-acwy", "febre-amarela", "triplice-viral", "hepatite-a", "varicela", "dtp", "hpv"],
    Adolescente: ["hpv", "dengue", "meningococica-acwy", "hepatite-b", "dt", "febre-amarela", "triplice-viral", "varicela"],
    Adulto: ["hepatite-b", "dt", "febre-amarela", "triplice-viral", "influenza", "covid", "varicela"],
    Idoso: ["influenza", "covid", "hepatite-b", "dt", "febre-amarela", "triplice-viral", "pneumo-23", "varicela"],
    Gestante: ["hepatite-b", "dt", "dtpa", "influenza", "covid", "vsr", "febre-amarela"],
};

export const FASES: { codigo: FaseVacinal; rotulo: string; cor: string }[] = [
    { codigo: "Crianca", rotulo: "Criança", cor: "#007DB8" },
    { codigo: "Adolescente", rotulo: "Adolescente / jovem", cor: "#15803D" },
    { codigo: "Adulto", rotulo: "Adulto", cor: "#005F8F" },
    { codigo: "Idoso", rotulo: "Idoso", cor: "#6D42A1" },
    { codigo: "Gestante", rotulo: "Gestante", cor: "#BE185D" },
];

export const TITULOS_FASE: Record<FaseVacinal, string> = {
    Crianca: "Carteira de vacinação da criança",
    Adolescente: "Carteira de vacinação do adolescente e jovem",
    Adulto: "Carteira de vacinação do adulto",
    Idoso: "Carteira de vacinação do idoso",
    Gestante: "Carteira de vacinação da gestante",
};

export function normalizar(valor: string): string {
    return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function catalogoPorCodigo(codigo: string): VacinaCatalogo | undefined {
    return VACINAS.find((item) => item.codigo === codigo);
}

export function identificarCodigo(registro: Pick<RegistroVacinal, "vacina" | "codigo">): string {
    if (registro.codigo && catalogoPorCodigo(registro.codigo)) return registro.codigo;
    const nome = normalizar(registro.vacina);
    return VACINAS.find((item) => normalizar(item.nome) === nome || item.aliases.some((alias) => normalizar(alias) === nome))?.codigo ?? nome;
}

export function idadeEmMeses(dataNascimento?: string, hoje = new Date()): number | null {
    if (!dataNascimento || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) return null;
    const [ano, mes, dia] = dataNascimento.split("-").map(Number);
    const nascimento = new Date(ano, mes - 1, dia);
    if (nascimento.getFullYear() !== ano || nascimento.getMonth() !== mes - 1 || nascimento.getDate() !== dia || nascimento > hoje) return null;
    let meses = (hoje.getFullYear() - ano) * 12 + hoje.getMonth() - (mes - 1);
    if (hoje.getDate() < dia) meses -= 1;
    return Math.max(0, meses);
}

export function fasePorIdade(meses: number | null): FaseVacinal | null {
    if (meses === null) return null;
    if (meses < 120) return "Crianca";
    if (meses < 300) return "Adolescente";
    if (meses < 720) return "Adulto";
    return "Idoso";
}

export function fasesAcessiveis(meses: number | null, gestante: boolean): FaseVacinal[] {
    const fase = fasePorIdade(meses);
    const ordem: FaseVacinal[] = ["Crianca", "Adolescente", "Adulto", "Idoso"];
    const indice = fase === null ? 3 : ordem.indexOf(fase);
    const permitidas = ordem.slice(0, indice + 1);
    if (gestante) permitidas.push("Gestante");
    return permitidas;
}

export function aplicada(registro: RegistroVacinal): boolean {
    const status = normalizar(registro.status);
    const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(registro.dataAplicacao) &&
        !Number.isNaN(Date.parse(`${registro.dataAplicacao}T12:00:00`)) &&
        registro.dataAplicacao <= new Date().toISOString().slice(0, 10);
    return dataValida && (status === "" || status.includes("aplicad") || status.includes("concluid") || status.includes("administrad"));
}

export function faseDoRegistro(registro: RegistroVacinal, nascimento?: string): FaseVacinal | null {
    if (registro.fase && FASES.some((f) => f.codigo === registro.fase)) return registro.fase;
    if (!nascimento || !registro.dataAplicacao) return null;
    return fasePorIdade(idadeEmMeses(nascimento, new Date(`${registro.dataAplicacao}T12:00:00`)));
}

export type RegraPeriodo = "qualquer" | "ano" | "seis-meses" | "gestacao";
export interface RequisitoVacinal {
    codigo: string;
    nome: string;
    doses: number;
    periodo: RegraPeriodo;
}

function regra(codigo: string, doses: number, periodo: RegraPeriodo = "qualquer"): RequisitoVacinal {
    return { codigo, nome: catalogoPorCodigo(codigo)?.nome ?? codigo, doses, periodo };
}

/** Lista reduzida para EXERCÍCIO acadêmico; não reproduz todas as regras PNI. */
export function requisitosDemonstrativos(meses: number, perfil: PerfilVacinal): RequisitoVacinal[] {
    let lista: RequisitoVacinal[];
    if (meses < 120) {
        lista = [regra("bcg", 1), regra("hepatite-b", 1)];
        if (meses >= 2) lista.push(regra("penta", 1), regra("vip", 1), regra("rotavirus", 1), regra("pneumo", 1));
        if (meses >= 3) lista.push(regra("meningococica-c", 1));
        if (meses >= 4) lista = lista.map((r) => ["penta", "vip", "rotavirus", "pneumo"].includes(r.codigo) ? { ...r, doses: 2 } : r);
        if (meses >= 5) lista = lista.map((r) => r.codigo === "meningococica-c" ? { ...r, doses: 2 } : r);
        if (meses >= 6) lista = lista.map((r) => ["penta", "vip"].includes(r.codigo) ? { ...r, doses: 3 } : r);
        if (meses >= 9) lista.push(regra("febre-amarela", 1));
        if (meses >= 108) lista.push(regra("hpv", 1));
        if (meses >= 12) lista.push(regra("triplice-viral", 1));
        if (meses >= 15) lista.push(regra("hepatite-a", 1), regra("varicela", 1), regra("dtp", 1));
        if (meses >= 48) lista = lista.map((r) => ["dtp", "varicela"].includes(r.codigo) ? { ...r, doses: 2 } : r);
    } else if (meses < 300) {
        lista = [regra("hepatite-b", 3), regra("dt", 3), regra("febre-amarela", 1), regra("triplice-viral", 2)];
        if (meses < 180) lista.push(regra("hpv", 1), regra("dengue", 2));
        if (meses >= 132 && meses < 180) lista.push(regra("meningococica-acwy", 1));
    } else if (meses < 720) {
        lista = [regra("hepatite-b", 3), regra("dt", 3), regra("febre-amarela", 1), regra("triplice-viral", meses < 360 ? 2 : 1)];
    } else {
        lista = [regra("hepatite-b", 3), regra("dt", 3), regra("influenza", 1, "ano"), regra("covid", 1, "seis-meses")];
    }
    // Um conjunto demonstrativo de exigências gestacionais, condicionado à
    // semana informada. A avaliação médica é indispensável na vida real.
    if (perfil.gestanteAtual) {
        lista.push(regra("influenza", 1, "ano"), regra("covid", 1, "gestacao"));
        if (Number(perfil.semanasGestacao) >= 20) lista.push(regra("dtpa", 1, "gestacao"));
        if (Number(perfil.semanasGestacao) >= 28) lista.push(regra("vsr", 1, "gestacao"));
    }
    // Combinar exigências repetidas, mantendo a mais específica.
    return lista.filter((item, indice, todos) => todos.findIndex((outro) => outro.codigo === item.codigo && outro.periodo === item.periodo) === indice);
}

function passouNoPeriodo(registro: RegistroVacinal, regraPeriodo: RegraPeriodo, perfil: PerfilVacinal, hoje: Date): boolean {
    if (!aplicada(registro)) return false;
    if (regraPeriodo === "qualquer") return true;
    if (regraPeriodo === "ano") return Number(registro.dataAplicacao.slice(0, 4)) === hoje.getFullYear();
    if (regraPeriodo === "seis-meses") {
        const limite = new Date(hoje);
        limite.setMonth(limite.getMonth() - 6);
        return new Date(`${registro.dataAplicacao}T12:00:00`) >= limite;
    }
    return registro.fase === "Gestante" && registro.periodoGestacao === "atual" &&
        !!perfil.inicioGestacao && registro.dataAplicacao >= perfil.inicioGestacao;
}

export interface ResultadoAvaliacao {
    apto: boolean;
    motivo: string;
    faseAtual: FaseVacinal | null;
    itens: { requisito: RequisitoVacinal; registradas: number; completo: boolean }[];
}

export function avaliarComprovante(perfil: PerfilVacinal, registros: RegistroVacinal[], hoje = new Date()): ResultadoAvaliacao {
    const meses = idadeEmMeses(perfil.dataNascimento, hoje);
    const faseAtual = fasePorIdade(meses);
    if (meses === null) return { apto: false, motivo: "Informe a data de nascimento no perfil para avaliar os registros.", faseAtual: null, itens: [] };
    if (perfil.gestanteAtual && (!perfil.inicioGestacao || !Number.isFinite(Number(perfil.semanasGestacao)) || Number(perfil.semanasGestacao) < 1)) {
        return { apto: false, motivo: "Informe a data de início e a semana da gestação para avaliar a simulação.", faseAtual, itens: [] };
    }
    const regras = requisitosDemonstrativos(meses, perfil);
    const itens = regras.map((requisito) => {
        const doses = registros.filter((registro) => identificarCodigo(registro) === requisito.codigo && passouNoPeriodo(registro, requisito.periodo, perfil, hoje));
        // Evita que o mesmo lançamento duplicado conte duas vezes na simulação.
        const unicas = new Set(doses.map((registro) => `${registro.dose}|${registro.dataAplicacao}|${registro.periodoGestacao ?? ""}`));
        const registradas = unicas.size;
        return { requisito, registradas, completo: registradas >= requisito.doses };
    });
    return {
        apto: itens.length > 0 && itens.every((item) => item.completo),
        motivo: itens.every((item) => item.completo) ? "Checklist demonstrativo preenchido." : "Existem doses não identificadas no checklist demonstrativo.",
        faseAtual,
        itens,
    };
}
