
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

type Vacina = {
  id: string;
  nome?: string;
  dose?: string;
  status?: string;
};

export default function VacinacaoPage() {
  const router = useRouter();

  const [vacinasAtrasadas, setVacinasAtrasadas] = useState<Vacina[]>([]);
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
            "vacinacao"
          );

          const resultado = await getDocs(referencia);

          const registros = resultado.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Vacina, "id">),
          }));

          const atrasadas = registros.filter(
            (vacina) =>
              vacina.status?.toLowerCase() === "atrasada"
          );

          setVacinasAtrasadas(atrasadas);
        } catch {
          setErro(
            "Não foi possível carregar suas informações de vacinação."
          );
        } finally {
          setCarregando(false);
        }
      }
    );

    return () => cancelarObservador();
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Navigation />

      <main>
        <section className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-14">
          <div className="mb-10">
            <p className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-wide text-[#007DB8]">
              Vacinação
            </p>

            <h1 className="mt-2 font-[family-name:var(--font-inter)] text-3xl font-extrabold tracking-tight text-[#005F8F] sm:text-4xl">
              Vacinas atrasadas
            </h1>

            <p className="mt-2 font-[family-name:var(--font-roboto)] text-base leading-7 text-[#111827]/65">
              Consulte apenas as vacinas que estão com doses atrasadas.
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
                Carregando suas informações...
              </p>
            </section>
          ) : vacinasAtrasadas.length === 0 ? (
            <section className="rounded-3xl border border-green-200 bg-green-50 p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                ✓
              </div>

              <h2 className="mt-5 font-[family-name:var(--font-inter)] text-2xl font-extrabold text-[#16753E]">
                Sua vacinação está em dia
              </h2>

              <p className="mt-2 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#16753E]/75">
                Nenhuma vacina atrasada foi identificada.
              </p>
            </section>
          ) : (
            <section>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#111827]">
                    Atenção
                  </h2>

                  <p className="mt-1 font-[family-name:var(--font-roboto)] text-sm text-[#111827]/60">
                    {vacinasAtrasadas.length}{" "}
                    {vacinasAtrasadas.length === 1
                      ? "vacina atrasada"
                      : "vacinas atrasadas"}
                  </p>
                </div>

                <span className="flex h-11 min-w-11 items-center justify-center rounded-full bg-red-50 px-3 font-[family-name:var(--font-inter)] text-sm font-extrabold text-red-600">
                  {vacinasAtrasadas.length}
                </span>
              </div>

              <div className="space-y-4">
                {vacinasAtrasadas.map((vacina) => (
                  <article
                    key={vacina.id}
                    className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl">
                        ⚠
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-[family-name:var(--font-inter)] text-lg font-extrabold text-[#005F8F]">
                          {vacina.nome || "Vacina"}
                        </h3>

                        {vacina.dose && (
                          <p className="mt-1 font-[family-name:var(--font-roboto)] text-sm text-[#111827]/60">
                            {vacina.dose}
                          </p>
                        )}

                        <span className="mt-3 inline-flex rounded-full bg-red-50 px-3 py-1 font-[family-name:var(--font-inter)] text-xs font-bold text-red-600">
                          Dose atrasada
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl border border-[#D1D5DB] bg-[#F5F7FA] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] transition hover:border-[#007DB8] hover:bg-white"
            >
              ← Voltar para minha área
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

