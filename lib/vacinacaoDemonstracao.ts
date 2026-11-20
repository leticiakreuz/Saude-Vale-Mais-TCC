import { aplicada, avaliarComprovante, catalogoPorCodigo, CATALOGO_POR_FASE, faseDoRegistro, fasesAcessiveis, identificarCodigo, idadeEmMeses, requisitosDemonstrativos, type FaseVacinal, type PerfilVacinal, type RegistroVacinal } from "./vacinacaoRegras";

/** Dados sintéticos para testar a interface e o checklist do TCC.
 * Datas ilustrativas: não representam um esquema de vacinação real.
 */
export function gerarVacinasDemonstrativas(perfil: PerfilVacinal, existentes: RegistroVacinal[], hoje = new Date()): RegistroVacinal[] {
  const inicial = avaliarComprovante(perfil, existentes, hoje);
  if (!inicial.faseAtual) throw new Error("O perfil precisa de uma data de nascimento válida.");
  if (inicial.itens.length === 0) throw new Error(inicial.motivo);
  const novos: RegistroVacinal[] = [];
  const dataAtual = hoje.toISOString().slice(0, 10);
  for (const item of inicial.itens) {
    const atualizado = avaliarComprovante(perfil, [...existentes, ...novos], hoje).itens.find(i => i.requisito.codigo === item.requisito.codigo && i.requisito.periodo === item.requisito.periodo)!;
    for (let dose = atualizado.registradas + 1; dose <= item.requisito.doses; dose++) {
      const data = new Date(hoje);
      if (item.requisito.periodo === "qualquer") data.setUTCDate(data.getUTCDate() - (item.requisito.doses - dose) * 180);
      const dataAplicacao = [data.toISOString().slice(0, 10), perfil.dataNascimento ?? "", item.requisito.periodo === "gestacao" ? perfil.inicioGestacao ?? "" : ""].sort().at(-1)!;
      const registro: RegistroVacinal = {
        id: `tcc-demo-${dataAtual}-${item.requisito.codigo}-${item.requisito.periodo}-${dose}`,
        demonstracao: true,
        codigo: item.requisito.codigo,
        vacina: item.requisito.nome,
        dose: `${dose}ª dose (demonstração TCC)`,
        dataAplicacao,
        dataPrevista: "",
        lote: "DEMONSTRACAO-TCC",
        unidade: "Unidade fictícia — demonstração acadêmica",
        status: "Aplicada — demonstração TCC",
        fase: item.requisito.periodo === "gestacao" ? "Gestante" : inicial.faseAtual,
        ...(item.requisito.periodo === "gestacao" ? {periodoGestacao: "atual" as const} : {}),
      };
      if (existentes.some(r => r.id === registro.id)) throw new Error("Um registro demonstrativo com este identificador já existe. Nenhum dado será sobrescrito.");
      novos.push(registro);
    }
  }
  if (!avaliarComprovante(perfil, [...existentes, ...novos], hoje).apto) throw new Error("Os dados de demonstração não completaram o checklist. Nenhum dado será gravado.");
  return novos;
}

/** Cenários independentes das fases da interface: não reconstituem um histórico clínico. */
export function gerarCarteirinhasDemonstrativas(perfil: PerfilVacinal, existentes: RegistroVacinal[], hoje = new Date()): RegistroVacinal[] {
  const novos = gerarVacinasDemonstrativas(perfil, existentes, hoje);
  const amostras: Record<Exclude<FaseVacinal,"Gestante">,number[]> = {Crianca:[0,2,3,4,5,6,9,12,15,48,108,119],Adolescente:[120,132,179,180,299],Adulto:[300,359,360,719],Idoso:[720]};
  const data = hoje.toISOString().slice(0,10);
  for (const fase of fasesAcessiveis(idadeEmMeses(perfil.dataNascimento,hoje),false)) {
    if (fase === "Gestante") continue;
    const quantidades = new Map<string,number>();
    for (const meses of amostras[fase]) for (const requisito of requisitosDemonstrativos(meses,{})) quantidades.set(requisito.codigo,Math.max(quantidades.get(requisito.codigo)??0,requisito.doses));
    for (const codigo of CATALOGO_POR_FASE[fase]) {
      const quantidade = quantidades.get(codigo) ?? 1;
      const registros = [...existentes,...novos].filter(r=>faseDoRegistro(r,perfil.dataNascimento)===fase && identificarCodigo(r)===codigo && aplicada(r));
      const contagem = new Set(registros.map(r=>`${r.dose}|${r.dataAplicacao}|${r.periodoGestacao??""}`)).size;
      for (let dose=contagem+1;dose<=quantidade;dose++) {
        const id=`tcc-carteirinha-demo-${data}-${fase}-${codigo}-${dose}`;
        if (existentes.some(r=>r.id===id)) throw new Error("Um cenário com este identificador já existe. Nenhum dado será sobrescrito.");
        novos.push({id,demonstracao:true,codigo,vacina:catalogoPorCodigo(codigo)?.nome??codigo,dose:`${dose}ª dose (demonstração TCC)`,dataAplicacao:data,dataPrevista:"",lote:"DEMONSTRACAO-TCC",unidade:"Cenário fictício — demonstração acadêmica",status:"Aplicada — demonstração TCC",fase});
      }
    }
  }
  return novos;
}
