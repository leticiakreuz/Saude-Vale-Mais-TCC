
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";
import { auth, db } from "../firebase";

type Medicamento = {
  id: string;
  nome?: string;
  dosagem?: string;
  quantidade?: string;
  frequencia?: string;
  proximaRetirada?: string;
  status?: string;
  observacao?: string;
};

export default function MedicamentosPage() {
  const router = useRouter();

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const cancelarObservador = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          router.replace("/login");
          return;
        }

        try {
          const referencia = collection(
            db,
            "usuarios",
            user.uid,
            "medicamentos"
          );

          const resultado = await getDocs(referencia);

          const registros = resultado.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Medicamento, "id">),
          }));

          setMedicamentos(registros);
        } catch {
          setErro(
            "Não foi possível carregar seus medicamentos."
          );
        } finally {
          setCarregando(false);
        }
      }
    );

    return () => cancelarObservador();
  }, [router]);

  const formatarData = (data?: string) => {
    if (!data) {
      return "Não informada";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const medicamentosAtivos = medicamentos.filter(
    (medicamento) =>
      medicamento.status?.toLowerCase() !== "encerrado" &&
      medicamento.status?.toLowerCase() !== "cancelado"
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Navigation />

      <main>
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          <div className="mb-8">
            <p className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-wide text-[#007DB8]">
              Medicamentos
            </p>

            <h1 className="mt-2 font-[family-name:var(--font-inter)] text-3xl font-extrabold tracking-tight text-[#005F8F] sm:text-4xl">
              Meus medicamentos
            </h1>

            <p className="mt-2 max-w-3xl font-[family-name:var(--font-roboto)] text-base leading-7 text-[#111827]/65">
              Consulte somente os medicamentos vinculados à sua prescrição.
            </p>
          </div>

          {erro && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-[family-name:var(--font-roboto)] text-sm text-red-700"
            >
              {erro}
            </div>
          )}

          {carregando ? (
            <section className="rounded-3xl border border-[#D1D5DB] bg-[#F5F7FA] p-10 text-center">
              <p className="font-[family-name:var(--font-roboto)] text-sm text-[#111827]/55">
                Carregando seus medicamentos...
              </p>
            </section>
          ) : medicamentosAtivos.length === 0 ? (
            <section className="mx-auto max-w-3xl rounded-3xl border border-[#D1D5DB] bg-[#F5F7FA] p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                💊
              </div>

              <h2 className="mt-5 font-[family-name:var(--font-inter)] text-2xl font-extrabold text-[#005F8F]">
                Nenhum medicamento disponível
              </h2>

              <p className="mx-auto mt-2 max-w-xl font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/60">
                Não há medicamentos vinculados à sua conta no momento.
              </p>
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-wide text-[#007DB8]">
                      Prescrição
                    </p>

                    <h2 className="mt-2 font-[family-name:var(--font-inter)] text-2xl font-extrabold text-[#111827]">
                      Medicamentos vinculados
                    </h2>
                  </div>

                  <span className="rounded-full bg-[#8ED3F5]/30 px-3 py-1 font-[family-name:var(--font-inter)] text-xs font-bold text-[#005F8F]">
                    {medicamentosAtivos.length}{" "}
                    {medicamentosAtivos.length === 1
                      ? "medicamento"
                      : "medicamentos"}
                  </span>
                </div>

                <div className="mt-7 space-y-4">
                  {medicamentosAtivos.map((medicamento) => (
                    <article
                      key={medicamento.id}
                      className="rounded-3xl border border-[#D1D5DB] bg-white p-6 transition hover:border-[#8ED3F5]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#22C55E]/10 text-2xl">
                          💊
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-[family-name:var(--font-inter)] text-lg font-extrabold text-[#005F8F]">
                            {medicamento.nome ||
                              "Medicamento"}
                          </h3>

                          {medicamento.dosagem && (
                            <p className="mt-1 font-[family-name:var(--font-roboto)] text-sm text-[#111827]/60">
                              {medicamento.dosagem}
                            </p>
                          )}

                          {medicamento.status && (
                            <span className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-1 font-[family-name:var(--font-inter)] text-xs font-bold text-[#16753E]">
                              {medicamento.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {medicamento.quantidade && (
                          <div className="rounded-xl bg-[#F5F7FA] p-4">
                            <p className="font-[family-name:var(--font-roboto)] text-xs text-[#111827]/45">
                              Quantidade
                            </p>

                            <p className="mt-1 font-[family-name:var(--font-inter)] text-sm font-bold text-[#111827]">
                              {medicamento.quantidade}
                            </p>
                          </div>
                        )}

                        {medicamento.frequencia && (
                          <div className="rounded-xl bg-[#F5F7FA] p-4">
                            <p className="font-[family-name:var(--font-roboto)] text-xs text-[#111827]/45">
                              Frequência
                            </p>

                            <p className="mt-1 font-[family-name:var(--font-inter)] text-sm font-bold text-[#111827]">
                              {medicamento.frequencia}
                            </p>
                          </div>
                        )}

                        {medicamento.proximaRetirada && (
                          <div className="rounded-xl bg-[#F5F7FA] p-4">
                            <p className="font-[family-name:var(--font-roboto)] text-xs text-[#111827]/45">
                              Próxima retirada
                            </p>

                            <p className="mt-1 font-[family-name:var(--font-inter)] text-sm font-bold text-[#111827]">
                              {formatarData(
                                medicamento.proximaRetirada
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {medicamento.observacao && (
                        <div className="mt-4 rounded-xl border border-[#D1D5DB] bg-[#F5F7FA] p-4">
                          <p className="font-[family-name:var(--font-roboto)] text-xs leading-5 text-[#111827]/60">
                            {medicamento.observacao}
                          </p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <aside className="h-fit space-y-6">
                <section className="rounded-3xl bg-[#005F8F] p-6 text-white shadow-sm">
                  <p className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-wide text-[#8ED3F5]">
                    Retirada
                  </p>

                  <h2 className="mt-2 font-[family-name:var(--font-inter)] text-2xl font-extrabold">
                    Medicamentos da sua prescrição
                  </h2>

                  <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-6 text-white/70">
                    Aqui aparecem somente os medicamentos vinculados ao seu
                    cadastro.
                  </p>
                </section>

                <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm">
                  <p className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-wide text-[#007DB8]">
                    Unidade de saúde
                  </p>

                  <h2 className="mt-2 font-[family-name:var(--font-inter)] text-lg font-extrabold text-[#005F8F]">
                    Retirada na unidade
                  </h2>

                  <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/60">
                    A disponibilidade e as condições de retirada devem seguir
                    as informações fornecidas pela unidade de saúde.
                  </p>
                </section>

                <Link
                  href="/dashboard"
                  className="block rounded-2xl border border-[#D1D5DB] bg-[#F5F7FA] p-5 text-center font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] transition hover:border-[#007DB8] hover:bg-white"
                >
                  ← Voltar para minha área
                </Link>
              </aside>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

