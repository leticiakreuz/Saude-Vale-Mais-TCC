
export type Endereco = {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export async function Endereco(
  cepInformado: string
): Promise<Endereco> {
  const cep = cepInformado.replace(/\D/g, "");

  if (cep.length !== 8) {
    throw new Error("Digite um CEP válido com 8 números.");
  }

  const resposta = await fetch(
    `https://viacep.com.br/ws/${cep}/json/`
  );

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const dados = await resposta.json();

  if (dados.erro) {
    throw new Error("CEP não encontrado.");
  }

  if (dados.uf !== "SC" || dados.localidade !== "Blumenau") {
    throw new Error(
      "O Saúde Vale+ atende somente endereços de Blumenau - SC."
    );
  }

  return {
    cep: dados.cep ?? cep,
    rua: dados.logradouro ?? "",
    bairro: dados.bairro ?? "",
    cidade: "Blumenau",
    estado: "SC",
  };
}