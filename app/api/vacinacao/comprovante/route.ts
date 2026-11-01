
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import {
    avaliarComprovante,
    type PerfilVacinal,
    type RegistroVacinal,
} from "@/lib/vacinacaoRegras";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function erro(mensagem: string, status: number) {
    return NextResponse.json(
        { erro: mensagem },
        { status }
    );
}

export async function POST(request: NextRequest) {
    try {
        const authorization = request.headers.get("authorization");

        if (!authorization?.startsWith("Bearer ")) {
            return erro("Você precisa estar autenticado.", 401);
        }

        const token = authorization.slice(7).trim();
        const usuario = await adminAuth.verifyIdToken(token, true);

        const usuarioRef = adminDb
            .collection("usuarios")
            .doc(usuario.uid);

        const [perfilDoc, vacinasDoc] = await Promise.all([
            usuarioRef.get(),
            usuarioRef.collection("vacinacao").get(),
        ]);

        if (!perfilDoc.exists) {
            return erro("Perfil não encontrado.", 404);
        }

        const dados = perfilDoc.data() ?? {};

        const perfil: PerfilVacinal = {
            nome: String(dados.nome ?? usuario.name ?? ""),
            dataNascimento: String(dados.dataNascimento ?? ""),
            gestanteAtual: dados.gestanteAtual === true,
            jaFoiGestante: dados.jaFoiGestante === true,
            semanasGestacao: Number(dados.semanasGestacao ?? 0),
            inicioGestacao: String(dados.inicioGestacao ?? ""),
        };

        const registros: RegistroVacinal[] = vacinasDoc.docs.map(
            (documento) => {
                const dadosVacina = documento.data();

                return {
                    id: documento.id,
                    codigo: String(dadosVacina.codigo ?? ""),
                    vacina: String(dadosVacina.vacina ?? dadosVacina.nome ?? ""),
                    dose: String(dadosVacina.dose ?? ""),
                    dataAplicacao: String(
                        dadosVacina.dataAplicacao ?? dadosVacina.data ?? ""
                    ),
                    dataPrevista: String(dadosVacina.dataPrevista ?? ""),
                    lote: String(dadosVacina.lote ?? ""),
                    unidade: String(dadosVacina.unidade ?? ""),
                    status: String(dadosVacina.status ?? ""),
                    fase: dadosVacina.fase,
                    periodoGestacao: dadosVacina.periodoGestacao,
                    anoGestacao: String(dadosVacina.anoGestacao ?? ""),
                };
            }
        );

        const avaliacao = avaliarComprovante(perfil, registros);

        if (!avaliacao.apto || !avaliacao.faseAtual) {
            return erro(
                "O checklist demonstrativo de vacinação ainda não foi preenchido.",
                409
            );
        }

        const pdf = await PDFDocument.create();

        pdf.setTitle("Comprovante de Bom Cidadao - Simulacao");
        pdf.setAuthor("Saude Vale+");

        const pagina = pdf.addPage([595, 842]);

        const fonte = await pdf.embedFont(StandardFonts.Helvetica);
        const negrito = await pdf.embedFont(
            StandardFonts.HelveticaBold
        );

        const azul = rgb(0, 0.37, 0.56);
        const cinza = rgb(0.25, 0.30, 0.35);

        // Remove caracteres que a fonte padrão não suporta.
        function textoSeguro(texto: string) {
            return texto
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\x20-\x7E]/g, "")
                .slice(0, 90);
        }

        pagina.drawRectangle({
            x: 0,
            y: 730,
            width: 595,
            height: 112,
            color: azul,
        });

        pagina.drawText("SAUDE VALE+", {
            x: 45,
            y: 798,
            size: 24,
            font: negrito,
            color: rgb(1, 1, 1),
        });

        pagina.drawText("COMPROVANTE DE BOM CIDADAO", {
            x: 45,
            y: 765,
            size: 16,
            font: negrito,
            color: rgb(1, 1, 1),
        });

        pagina.drawText(
            "SIMULACAO ACADEMICA - SEM VALIDADE OFICIAL",
            {
                x: 45,
                y: 744,
                size: 10,
                font: negrito,
                color: rgb(1, 0.9, 0.7),
            }
        );

        const nome = textoSeguro(
            perfil.nome || "Nome nao informado"
        );

        const emissao = new Date().toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
        });

        pagina.drawText("Nome do cidadao:", {
            x: 45,
            y: 690,
            size: 11,
            font: fonte,
            color: cinza,
        });

        pagina.drawText(nome, {
            x: 45,
            y: 665,
            size: 16,
            font: negrito,
            color: azul,
            maxWidth: 500,
        });

        pagina.drawText(
            `Data de emissao: ${emissao}`,
            {
                x: 45,
                y: 630,
                size: 11,
                font: fonte,
                color: cinza,
            }
        );

        pagina.drawText(
            `Fase: ${avaliacao.faseAtual}`,
            {
                x: 45,
                y: 608,
                size: 11,
                font: fonte,
                color: cinza,
            }
        );

        pagina.drawRectangle({
            x: 45,
            y: 545,
            width: 505,
            height: 45,
            color: rgb(0.9, 0.97, 0.92),
        });

        pagina.drawText(
            "CHECKLIST DEMONSTRATIVO PREENCHIDO",
            {
                x: 57,
                y: 562,
                size: 14,
                font: negrito,
                color: rgb(0.1, 0.45, 0.25),
            }
        );

        pagina.drawText(
            "Vacinas consideradas nesta simulacao:",
            {
                x: 45,
                y: 520,
                size: 12,
                font: negrito,
                color: azul,
            }
        );

        let y = 495;

        for (const item of avaliacao.itens) {
            if (y < 230) break;

            const vacina = textoSeguro(item.requisito.nome);

            pagina.drawText(vacina, {
                x: 48,
                y,
                size: 10,
                font: fonte,
                color: cinza,
                maxWidth: 420,
            });

            pagina.drawText(
                `${item.registradas}/${item.requisito.doses}`,
                {
                    x: 490,
                    y,
                    size: 10,
                    font: negrito,
                    color: azul,
                }
            );

            y -= 22;
        }

        pagina.drawRectangle({
            x: 45,
            y: 92,
            width: 505,
            height: 110,
            color: rgb(0.98, 0.95, 0.89),
        });

        pagina.drawText("AVISO IMPORTANTE", {
            x: 58,
            y: 179,
            size: 12,
            font: negrito,
            color: cinza,
        });

        const avisos = [
            "Documento criado exclusivamente para um TCC.",
            "Nao e um comprovante oficial de vacinacao.",
            "Nao substitui documentos emitidos pelo SUS.",
            "SIMULACAO ACADEMICA - SEM VALIDADE OFICIAL.",
        ];

        avisos.forEach((aviso, indice) => {
            pagina.drawText(aviso, {
                x: 58,
                y: 157 - indice * 17,
                size: 10,
                font: fonte,
                color: cinza,
            });
        });

        const bytes = await pdf.save();

        return new NextResponse(new Uint8Array(bytes), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition":
                    'attachment; filename="comprovante-bom-cidadao.pdf"',
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error("Erro no comprovante:", error);

        return erro(
            "Não foi possível gerar o comprovante.",
            500
        );
    }
}
