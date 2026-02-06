export const MOCK_DADOS_FAZENDAS = {
  1: {
    nome: "Fazenda Jundiaí",
    totalAnimais: 145, vacasLactacao: 89, vacasSecas: 23, novilhas: 18, bezerras: 15,
    producaoMediaDia: 28.4, custoLitro: 1.85, taxaDescarte: 15,
    taxaServico: 82, taxaConcepcao: 64, iepMedio: 418, iepProjeto: 395,
    diasAbertosMedio: 85, taxaMortalidade: 1.2,
    partosPrevistosMes: 12, secagensMes: 8,
    telefoneProdutor: "(11) 98765-4321", nomeProdutor: "João Silva",
    ultimaVisita: "2024-01-28",
    alertas: [
      { id: 1, tipo: "mastite", qtd: 2, gravidade: "alta", mensagem: "2 casos de mastite aguda pós-parto" },
      { id: 2, tipo: "reproducao", qtd: 5, gravidade: "media", mensagem: "5 vacas abertas > 150 dias" }
    ]
  },
  2: {
    nome: "Fazenda Boa Vista",
    totalAnimais: 89, vacasLactacao: 52, vacasSecas: 18, novilhas: 12, bezerras: 7,
    producaoMediaDia: 24.1, custoLitro: 2.10, taxaDescarte: 18,
    taxaServico: 75, taxaConcepcao: 48, iepMedio: 445, iepProjeto: 430,
    diasAbertosMedio: 112, taxaMortalidade: 2.1,
    partosPrevistosMes: 6, secagensMes: 4,
    telefoneProdutor: "(19) 99876-5432", nomeProdutor: "Maria Oliveira",
    ultimaVisita: "2024-01-30",
    alertas: [
      { id: 3, tipo: "sanitario", qtd: 1, gravidade: "alta", mensagem: "1 animal com febre persistente" }
    ]
  }
};

export const MOCK_VISITAS = [
  { id: 1, fazendaId: 1, data: "2024-02-05", hora: "09:00", tipo: "Rotina", status: "agendada" },
  { id: 2, fazendaId: 2, data: "2024-02-05", hora: "14:00", tipo: "Inseminação", status: "agendada" },
  { id: 3, fazendaId: 1, data: "2024-02-08", hora: "10:30", tipo: "Vacinação", status: "agendada" },
];