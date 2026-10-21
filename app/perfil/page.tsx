"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";
import { auth, db } from "../firebase";

type Perfil = {
  uid?: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  dataNascimento?: string;
  numeroSUS?: string;
  cartaoSus?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  unidade?: string;
  unidadeReferencia?: string;
};

const CAMPOS_OBRIGATORIOS: (keyof Perfil)[] = [
  "nome",
  "cpf",
  "telefone",
  "dataNascimento",
  "numeroSUS",
  "cep",
  "rua",
  "numero",
  "bairro",
  "cidade",
];

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function normalizarPerfil(dados: Perfil): Perfil {
  return {
    ...dados,
    numeroSUS: dados.numeroSUS ?? dados.cartaoSus ?? "",
    cartaoSus: dados.cartaoSus ?? dados.numeroSUS ?? "",
    unidade: dados.unidade ?? dados.unidadeReferencia ?? "",
    unidadeReferencia:
      dados.unidadeReferencia ?? dados.unidade ?? "",
  };
}

function formatarTelefone(valor: string) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 2) return numeros;

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function listarPendencias(perfil: Perfil) {
  const dados = normalizarPerfil(perfil);

  return CAMPOS_OBRIGATORIOS.filter((campo) => {
    const valor = String(dados[campo] ?? "").trim();
    return !valor;
  }).map((campo) => {
    const nomes: Record<string, string> = {
      nome: "nome completo",
      cpf: "CPF",
      telefone: "telefone",
      dataNascimento: "data de nascimento",
      numeroSUS: "Cartão SUS",
      cep: "CEP",
      rua: "rua ou avenida",
      numero: "número do endereço",
      bairro: "bairro",
      cidade: "cidade",
    };

    return nomes[campo] ?? campo;
  });
}

function ConteudoPerfil() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mostrarPendencias =
    searchParams.get("pendencias") === "1";

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>({});
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        router.replace("/login");
        return;
      }

      setEmail(usuario.email ?? "");

      try {
        const referencia = doc(db, "usuarios", usuario.uid);
        const resultado = await getDoc(referencia);

        const dadosSalvos = resultado.exists()
          ? (resultado.data() as Perfil)
          : {};

        setPerfil(
          normalizarPerfil({
            ...dadosSalvos,
            uid: usuario.uid,
            email: usuario.email ?? dadosSalvos.email ?? "",
            nome: dadosSalvos.nome ?? usuario.displayName ?? "",
          })
        );
      } catch (erroFirebase) {
        console.error("Erro ao carregar perfil:", erroFirebase);
        setErro(
          "Não foi possível carregar seus dados. Tente novamente."
        );
      } finally {
        setCarregando(false);
      }
    });

    return () => cancelar();
  }, [router]);

  const atualizarCampo = (
    campo: keyof Perfil,
    valor: string
  ) => {
    setPerfil((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
    setMensagem("");
    setErro("");
  };

  const consultarCep = async () => {
    const cepNumerico = somenteNumeros(perfil.cep ?? "");

    if (!cepNumerico) return;

    if (cepNumerico.length !== 8) {
      setErro("O CEP deve conter oito números.");
      return;
    }

    setConsultandoCep(true);
    setErro("");
    setMensagem("");

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cepNumerico}/json/`
      );

      if (!resposta.ok) {
        throw new Error("Falha na consulta do CEP.");
      }

      const dados = await resposta.json();

      if (dados.erro) {
        throw new Error("CEP não encontrado.");
      }

      if (
        String(dados.localidade ?? "").trim().toLowerCase() !==
        "blumenau" ||
        String(dados.uf ?? "").trim().toUpperCase() !== "SC"
      ) {
        setErro(
          "Para este cadastro, informe um CEP de Blumenau–SC."
        );

        setPerfil((anterior) => ({
          ...anterior,
          rua: "",
          bairro: "",
          cidade: "",
          uf: "",
        }));

        return;
      }

      setPerfil((anterior) => ({
        ...anterior,
        cep: cepNumerico,
        rua: dados.logradouro || anterior.rua || "",
        bairro: dados.bairro || anterior.bairro || "",
        cidade: dados.localidade,
        uf: dados.uf,
      }));

      setMensagem(
        "CEP localizado em Blumenau–SC. Confira o endereço e complete o número."
      );
    } catch (erroCep) {
      console.error("Erro na consulta ViaCEP:", erroCep);

      setErro(
        erroCep instanceof Error
          ? erroCep.message
          : "Não foi possível consultar o CEP."
      );
    } finally {
      setConsultandoCep(false);
    }
  };

  const salvarPerfil = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setMensagem("");
    setErro("");

    const usuario = auth.currentUser;

    if (!usuario) {
      router.replace("/login");
      return;
    }

    const dados = normalizarPerfil(perfil);
    const pendencias = listarPendencias(dados);

    if (pendencias.length > 0) {
      setErro(
        `Complete os seguintes campos: ${pendencias.join(", ")}.`
      );
      return;
    }

    const cpfNumerico = somenteNumeros(dados.cpf ?? "");
    const telefoneNumerico = somenteNumeros(
      dados.telefone ?? ""
    );
    const susNumerico = somenteNumeros(
      dados.numeroSUS ?? ""
    );
    const cepNumerico = somenteNumeros(dados.cep ?? "");

    if (cpfNumerico.length !== 11) {
      setErro("O CPF deve conter 11 números.");
      return;
    }

    if (![10, 11].includes(telefoneNumerico.length)) {
      setErro("Informe um telefone com DDD e número válido.");
      return;
    }

    if (susNumerico.length !== 15) {
      setErro(
        "O número do Cartão SUS deve conter 15 números."
      );
      return;
    }

    if (cepNumerico.length !== 8) {
      setErro("Informe um CEP válido com oito números.");
      return;
    }

    if (
      dados.cidade?.trim().toLowerCase() !== "blumenau" ||
      dados.uf?.trim().toUpperCase() !== "SC"
    ) {
      setErro(
        "Consulte um CEP válido de Blumenau–SC antes de salvar."
      );
      return;
    }

    try {
      setSalvando(true);

      const referencia = doc(db, "usuarios", usuario.uid);

      await setDoc(
        referencia,
        {
          ...dados,
          uid: usuario.uid,
          email: usuario.email ?? email,
          cpf: cpfNumerico,
          telefone: telefoneNumerico,
          numeroSUS: susNumerico,
          cartaoSus: susNumerico,
          cep: cepNumerico,
          unidade:
            dados.unidade ?? dados.unidadeReferencia ?? "",
          unidadeReferencia:
            dados.unidadeReferencia ?? dados.unidade ?? "",
          perfilAtualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      setPerfil((anterior) =>
        normalizarPerfil({
          ...anterior,
          ...dados,
          cpf: cpfNumerico,
          telefone: formatarTelefone(telefoneNumerico),
          numeroSUS: susNumerico,
          cartaoSus: susNumerico,
          cep: cepNumerico,
        })
      );

      setMensagem("Seus dados foram salvos com sucesso.");
      router.replace("/perfil");
    } catch (erroFirebase) {
      console.error("Erro ao salvar perfil:", erroFirebase);

      setErro(
        "Não foi possível salvar seus dados. Verifique sua conexão e as regras do Firestore."
      );
    } finally {
      setSalvando(false);
    }
  };

  const iniciais = (perfil.nome ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  const campoClasse =
    "w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#007DB8] focus:ring-2 focus:ring-[#8ED3F5]/50 disabled:bg-[#F5F7FA]";

  const labelClasse =
    "mb-2 block text-sm font-bold text-[#111827]";

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Navigation />

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-[#007DB8]">
            Meu perfil
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#005F8F]">
            Seus dados pessoais
          </h1>

          <p className="mt-2 max-w-2xl text-base leading-7 text-[#111827]/65">
            Complete suas informações para utilizar os serviços de
            agendamento do Saúde Vale+.
          </p>
        </div>

        {mostrarPendencias && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"
          >
            <h2 className="font-bold">Termine seu cadastro</h2>
            <p className="mt-1 text-sm leading-6">
              Para realizar um agendamento, precisamos que você
              complete as informações obrigatórias do seu perfil.
            </p>
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-2xl border border-[#D1D5DB] bg-[#F5F7FA] p-8">
            Carregando seus dados...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="h-fit rounded-3xl border border-[#D1D5DB] bg-[#F5F7FA] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#007DB8] text-xl font-extrabold text-white">
                  {iniciais || "US"}
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-[#111827]/55">
                    Cidadão
                  </p>
                  <h2 className="truncate font-extrabold text-[#005F8F]">
                    {perfil.nome || "Complete seu nome"}
                  </h2>
                  <p className="truncate text-sm text-[#111827]/60">
                    {email || "E-mail não informado"}
                  </p>
                </div>
              </div>

              <div className="my-6 border-t border-[#D1D5DB]" />

              <p className="text-sm font-bold text-[#005F8F]">
                Unidade de saúde
              </p>

              <p className="mt-2 text-sm leading-6 text-[#111827]/65">
                {perfil.unidade ||
                  perfil.unidadeReferencia ||
                  "A unidade de referência será identificada após a validação do endereço."}
              </p>
            </aside>

            <form onSubmit={salvarPerfil} className="space-y-6">
              <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-extrabold text-[#005F8F]">
                  Informações pessoais
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#111827]/60">
                  Os dados já existentes foram recuperados quando
                  disponíveis. Confira as informações e preencha
                  os campos que faltam.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClasse} htmlFor="nome">
                      Nome completo *
                    </label>
                    <input
                      id="nome"
                      className={campoClasse}
                      value={perfil.nome ?? ""}
                      onChange={(e) =>
                        atualizarCampo("nome", e.target.value)
                      }
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClasse} htmlFor="email">
                      E-mail
                    </label>
                    <input
                      id="email"
                      className={`${campoClasse} bg-[#F5F7FA]`}
                      value={email}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className={labelClasse} htmlFor="cpf">
                      CPF *
                    </label>
                    <input
                      id="cpf"
                      className={campoClasse}
                      value={perfil.cpf ?? ""}
                      onChange={(e) =>
                        atualizarCampo("cpf", e.target.value)
                      }
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Somente números ou com pontuação"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className={labelClasse}
                      htmlFor="dataNascimento"
                    >
                      Data de nascimento *
                    </label>
                    <input
                      id="dataNascimento"
                      type="date"
                      className={campoClasse}
                      value={perfil.dataNascimento ?? ""}
                      onChange={(e) =>
                        atualizarCampo(
                          "dataNascimento",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div>
                    <label
                      className={labelClasse}
                      htmlFor="telefone"
                    >
                      Telefone *
                    </label>
                    <input
                      id="telefone"
                      type="tel"
                      className={campoClasse}
                      value={perfil.telefone ?? ""}
                      onChange={(e) =>
                        atualizarCampo(
                          "telefone",
                          formatarTelefone(e.target.value)
                        )
                      }
                      autoComplete="tel"
                      placeholder="(47) 99999-9999"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className={labelClasse}
                      htmlFor="numeroSUS"
                    >
                      Cartão SUS (CNS) *
                    </label>
                    <input
                      id="numeroSUS"
                      className={campoClasse}
                      value={perfil.numeroSUS ?? ""}
                      onChange={(e) =>
                        atualizarCampo(
                          "numeroSUS",
                          somenteNumeros(e.target.value).slice(0, 15)
                        )
                      }
                      inputMode="numeric"
                      placeholder="15 números"
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-extrabold text-[#005F8F]">
                  Endereço
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#111827]/60">
                  Informe um CEP de Blumenau–SC. A consulta
                  preencherá automaticamente os dados disponibilizados
                  pela ViaCEP.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClasse} htmlFor="cep">
                      CEP *
                    </label>
                    <input
                      id="cep"
                      className={campoClasse}
                      value={perfil.cep ?? ""}
                      onChange={(e) =>
                        atualizarCampo(
                          "cep",
                          somenteNumeros(e.target.value).slice(0, 8)
                        )
                      }
                      onBlur={consultarCep}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="89000000"
                      required
                    />

                    {consultandoCep && (
                      <p className="mt-2 text-xs text-[#007DB8]">
                        Consultando CEP...
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClasse} htmlFor="numero">
                      Número *
                    </label>
                    <input
                      id="numero"
                      className={campoClasse}
                      value={perfil.numero ?? ""}
                      onChange={(e) =>
                        atualizarCampo("numero", e.target.value)
                      }
                      autoComplete="address-line2"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClasse} htmlFor="rua">
                      Rua ou avenida *
                    </label>
                    <input
                      id="rua"
                      className={campoClasse}
                      value={perfil.rua ?? ""}
                      onChange={(e) =>
                        atualizarCampo("rua", e.target.value)
                      }
                      autoComplete="address-line1"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClasse} htmlFor="bairro">
                      Bairro *
                    </label>
                    <input
                      id="bairro"
                      className={campoClasse}
                      value={perfil.bairro ?? ""}
                      onChange={(e) =>
                        atualizarCampo("bairro", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClasse} htmlFor="cidade">
                      Cidade *
                    </label>
                    <input
                      id="cidade"
                      className={`${campoClasse} bg-[#F5F7FA]`}
                      value={perfil.cidade ?? ""}
                      readOnly
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClasse} htmlFor="uf">
                      Estado
                    </label>
                    <input
                      id="uf"
                      className={`${campoClasse} bg-[#F5F7FA]`}
                      value={perfil.uf ?? ""}
                      readOnly
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      className={labelClasse}
                      htmlFor="unidade"
                    >
                      Unidade de saúde de referência
                    </label>
                    <input
                      id="unidade"
                      className={`${campoClasse} bg-[#F5F7FA]`}
                      value={
                        perfil.unidade ??
                        perfil.unidadeReferencia ??
                        ""
                      }
                      readOnly
                      placeholder="Será identificada conforme a abrangência territorial"
                    />
                    <p className="mt-2 text-xs leading-5 text-[#111827]/55">
                      A consulta de CEP não determina, sozinha, a UBS
                      responsável. A unidade será definida após a
                      integração com os dados oficiais de território.
                    </p>
                  </div>
                </div>
              </section>

              {mensagem && (
                <div
                  role="status"
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                  {mensagem}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-[#111827]/55">
                  * Campos obrigatórios para realizar agendamentos.
                </p>

                <button
                  type="submit"
                  disabled={salvando || consultandoCep}
                  className="rounded-xl bg-[#007DB8] px-6 py-3 font-bold text-white transition hover:bg-[#005F8F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar meu perfil"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white p-8">
          Carregando perfil...
        </div>
      }
    >
      <ConteudoPerfil />
    </Suspense>
  );
}
