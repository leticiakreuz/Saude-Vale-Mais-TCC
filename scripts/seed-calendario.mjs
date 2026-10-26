
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const chave = JSON.parse(
    readFileSync(
        new URL("../serviceAccountKey.json", import.meta.url),
        "utf8"
    )
);

initializeApp({
    credential: cert(chave),
});

const db = getFirestore();

const fonte =
    "https://www.gov.br/saude/pt-br/vacinacao/calendario";

const registros = [
    {
        id: "crianca-hepatite-b-nascimento",
        vacina: "Hepatite B",
        grupo: "Criança",
        idadeIndicada: "Ao nascer",
        dose: "1 dose",
        doencasPrevenidas: "Hepatite B e hepatite D",
    },
    {
        id: "crianca-bcg-nascimento",
        vacina: "BCG",
        grupo: "Criança",
        idadeIndicada: "Ao nascer",
        dose: "Dose única",
        doencasPrevenidas: "Formas graves da tuberculose",
    },
    {
        id: "crianca-penta-2-meses",
        vacina: "Pentavalente",
        grupo: "Criança",
        idadeIndicada: "2 meses",
        dose: "1ª dose",
        doencasPrevenidas:
            "Difteria, tétano, coqueluche, Hib e hepatite B",
    },
    {
        id: "crianca-vip-2-meses",
        vacina: "Poliomielite inativada (VIP)",
        grupo: "Criança",
        idadeIndicada: "2 meses",
        dose: "1ª dose",
        doencasPrevenidas: "Poliomielite",
    },
    {
        id: "crianca-pneumo-2-meses",
        vacina: "Pneumocócica",
        grupo: "Criança",
        idadeIndicada: "2 meses",
        dose: "1ª dose",
        doencasPrevenidas: "Doenças pneumocócicas",
    },
    {
        id: "crianca-rotavirus-2-meses",
        vacina: "Rotavírus humano",
        grupo: "Criança",
        idadeIndicada: "2 meses",
        dose: "1ª dose",
        doencasPrevenidas: "Gastroenterite por rotavírus",
    },
    {
        id: "crianca-meningo-3-meses",
        vacina: "Meningocócica C",
        grupo: "Criança",
        idadeIndicada: "3 meses",
        dose: "1ª dose",
        doencasPrevenidas: "Doença meningocócica pelo sorogrupo C",
    },
    {
        id: "crianca-penta-4-meses",
        vacina: "Pentavalente",
        grupo: "Criança",
        idadeIndicada: "4 meses",
        dose: "2ª dose",
        doencasPrevenidas:
            "Difteria, tétano, coqueluche, Hib e hepatite B",
    },
    {
        id: "crianca-vip-4-meses",
        vacina: "Poliomielite inativada (VIP)",
        grupo: "Criança",
        idadeIndicada: "4 meses",
        dose: "2ª dose",
        doencasPrevenidas: "Poliomielite",
    },
    {
        id: "crianca-rotavirus-4-meses",
        vacina: "Rotavírus humano",
        grupo: "Criança",
        idadeIndicada: "4 meses",
        dose: "2ª dose",
        doencasPrevenidas: "Gastroenterite por rotavírus",
    },
    {
        id: "crianca-meningo-5-meses",
        vacina: "Meningocócica C",
        grupo: "Criança",
        idadeIndicada: "5 meses",
        dose: "2ª dose",
        doencasPrevenidas: "Doença meningocócica pelo sorogrupo C",
    },
    {
        id: "crianca-penta-6-meses",
        vacina: "Pentavalente",
        grupo: "Criança",
        idadeIndicada: "6 meses",
        dose: "3ª dose",
        doencasPrevenidas:
            "Difteria, tétano, coqueluche, Hib e hepatite B",
    },
    {
        id: "crianca-vip-6-meses",
        vacina: "Poliomielite inativada (VIP)",
        grupo: "Criança",
        idadeIndicada: "6 meses",
        dose: "3ª dose",
        doencasPrevenidas: "Poliomielite",
    },
    {
        id: "crianca-triple-12-meses",
        vacina: "Tríplice viral (SCR)",
        grupo: "Criança",
        idadeIndicada: "12 meses",
        dose: "1ª dose",
        doencasPrevenidas: "Sarampo, caxumba e rubéola",
    },
    {
        id: "crianca-acwy-12-meses",
        vacina: "Meningocócica ACWY",
        grupo: "Criança",
        idadeIndicada: "12 meses",
        dose: "1 dose",
        doencasPrevenidas: "Doenças meningocócicas",
    },
    {
        id: "crianca-dtp-15-meses",
        vacina: "DTP",
        grupo: "Criança",
        idadeIndicada: "15 meses",
        dose: "1º reforço",
        doencasPrevenidas: "Difteria, tétano e coqueluche",
    },
    {
        id: "crianca-hepatite-a-15-meses",
        vacina: "Hepatite A",
        grupo: "Criança",
        idadeIndicada: "15 meses",
        dose: "1 dose",
        doencasPrevenidas: "Hepatite A",
    },
    {
        id: "jovem-hpv",
        vacina: "HPV4",
        grupo: "Adolescente e jovem",
        idadeIndicada: "9 a 14 anos",
        dose: "1 dose, conforme histórico vacinal",
        doencasPrevenidas: "Infecções pelo HPV",
    },
    {
        id: "jovem-dengue",
        vacina: "Dengue",
        grupo: "Adolescente e jovem",
        idadeIndicada: "10 a 14 anos",
        dose: "2 doses, conforme orientação vigente",
        doencasPrevenidas: "Dengue",
    },
    {
        id: "jovem-acwy",
        vacina: "Meningocócica ACWY",
        grupo: "Adolescente e jovem",
        idadeIndicada: "11 a 14 anos",
        dose: "1 dose",
        doencasPrevenidas: "Doenças meningocócicas",
    },
    {
        id: "adulto-hepatite-b",
        vacina: "Hepatite B",
        grupo: "Adulto",
        idadeIndicada: "Conforme histórico vacinal",
        dose: "Esquema conforme histórico vacinal",
        doencasPrevenidas: "Hepatite B e hepatite D",
    },
    {
        id: "adulto-dt",
        vacina: "Dupla adulto (dT)",
        grupo: "Adulto",
        idadeIndicada: "Conforme histórico vacinal",
        dose: "Esquema e reforços conforme histórico",
        doencasPrevenidas: "Difteria e tétano",
    },
    {
        id: "adulto-influenza",
        vacina: "Influenza",
        grupo: "Adulto",
        idadeIndicada: "Conforme indicação vigente",
        dose: "Conforme campanha e recomendação vigente",
        doencasPrevenidas: "Influenza",
    },
    {
        id: "idoso-influenza",
        vacina: "Influenza",
        grupo: "Idoso",
        idadeIndicada: "A partir de 60 anos",
        dose: "1 dose anual, conforme calendário vigente",
        doencasPrevenidas: "Influenza",
    },
    {
        id: "idoso-covid",
        vacina: "Covid-19",
        grupo: "Idoso",
        idadeIndicada: "A partir de 60 anos",
        dose: "Conforme calendário vigente",
        doencasPrevenidas: "Formas graves da Covid-19",
    },
    {
        id: "gestante-hepatite-b",
        vacina: "Hepatite B",
        grupo: "Gestante",
        idadeIndicada: "Conforme histórico vacinal",
        dose: "Esquema conforme histórico vacinal",
        doencasPrevenidas: "Hepatite B",
    },
    {
        id: "gestante-influenza",
        vacina: "Influenza",
        grupo: "Gestante",
        idadeIndicada: "Durante a gestação",
        dose: "1 dose por temporada",
        doencasPrevenidas: "Influenza",
    },
    {
        id: "gestante-dtpa",
        vacina: "dTpa",
        grupo: "Gestante",
        idadeIndicada: "A partir da 20ª semana gestacional",
        dose: "1 dose em cada gestação",
        doencasPrevenidas: "Difteria, tétano e coqueluche",
    },
    {
        id: "gestante-covid",
        vacina: "Covid-19",
        grupo: "Gestante",
        idadeIndicada: "Durante cada gestação",
        dose: "Conforme calendário vigente",
        doencasPrevenidas: "Formas graves da Covid-19",
    },
    {
        id: "gestante-vsr",
        vacina: "Vírus sincicial respiratório (VSR)",
        grupo: "Gestante",
        idadeIndicada: "A partir da 28ª semana gestacional",
        dose: "1 dose em cada gestação",
        doencasPrevenidas: "Doenças respiratórias graves por VSR no bebê",
    },
];

async function importarCalendario() {
    const colecao = db.collection("calendarioVacinacao");

    // O Firestore permite até 500 operações por lote.
    // Este exemplo possui menos de 500 registros.
    const lote = db.batch();

    for (const registro of registros) {
        const { id, ...dados } = registro;

        lote.set(
            colecao.doc(id),
            {
                ...dados,
                fonte,
                versaoCalendario: "2026",
                tipoRegistro: "recomendacao",
                atualizadoEm: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );
    }

    await lote.commit();

    console.log(
        `${registros.length} registros processados em calendarioVacinacao.`
    );
}

importarCalendario()
    .then(() => process.exit(0))
    .catch((erro) => {
        console.error("Erro ao importar o calendário:", erro);
        process.exit(1);
    });
