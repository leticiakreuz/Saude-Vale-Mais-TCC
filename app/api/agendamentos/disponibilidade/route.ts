import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        // Verificar se o paciente está autenticado
        const authorization = request.headers.get("authorization");

        if (!authorization?.startsWith("Bearer ")) {
            return NextResponse.json(
                { erro: "Usuário não autenticado." },
                { status: 401 }
            );
        }

        const token = authorization.substring(7);

        const usuario = await adminAuth.verifyIdToken(token);

        // Receber os filtros enviados pelo calendário
        const { searchParams } = new URL(request.url);

        const medico = searchParams.get("medico");
        const dia = searchParams.get("dia");

        if (!medico || !dia) {
            return NextResponse.json(
                { erro: "Informe o médico e a data." },
                { status: 400 }
            );
        }

        // Buscar a UBS diretamente no perfil do paciente
        const perfilSnapshot = await adminDb
            .collection("usuarios")
            .doc(usuario.uid)
            .get();

        if (!perfilSnapshot.exists) {
            return NextResponse.json(
                { erro: "Perfil do paciente não encontrado." },
                { status: 404 }
            );
        }

        const unidade = perfilSnapshot.data()?.unidadeReferencia;

        if (typeof unidade !== "string" || !unidade.trim()) {
            return NextResponse.json(
                { erro: "UBS de referência não cadastrada." },
                { status: 400 }
            );
        }

        // Consultar os horários reservados da UBS
        const resultado = await adminDb
            .collection("horariosReservados")
            .where("unidadeReferencia", "==", unidade.trim())
            .where("medico", "==", medico)
            .where("dia", "==", dia)
            .get();

        // Retornar somente os horários ocupados
        const horariosOcupados = resultado.docs
            .filter((documento) => {
                return documento.data().status === "reservado";
            })
            .map((documento) => documento.data().horario)
            .filter((horario): horario is string => typeof horario === "string");

        return NextResponse.json({
            horariosOcupados,
        });
    } catch (erro) {
        console.error("Erro ao consultar disponibilidade:", erro);

        return NextResponse.json(
            { erro: "Não foi possível consultar a disponibilidade." },
            { status: 500 }
        );
    }
}