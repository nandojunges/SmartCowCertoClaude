import React, { useState, useEffect } from 'react';

// ===== DADOS MOCKADOS: A FAZENDA EM ESTADO CRÍTICO/OPORTUNIDADE =====
const INTELIGENCIA_HOJE = {
  data: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  
  // 1. OPERAÇÕES CRÍTICAS (Missões do dia)
  missoes: [
    {
      id: 1,
      tipo: 'critico',
      titulo: 'Separar Lote 3 para Tratamento',
      descricao: 'Mastite subclínica detectada CMT ontem. Animais #0523, #1041, #0892 apresentaram celulas >500k.',
      risco: 'Contaminação cruzada do tanque de hoje à tarde',
      impactoFinanceiro: 850,
      prazoHoras: 3,
      responsavel: 'Funcionário A',
      status: 'pendente',
      icone: '⚡'
    },
    {
      id: 2,
      tipo: 'estrategico',
      titulo: 'Decisão Imediata: Animal #1029',
      descricao: 'IPP 425 dias. Custo de manutenção: R$ 35/dia. Último cio há 45 dias sem observação.',
      risco: 'Perda de 1 ano produtivo + descarte forçado',
      impactoFinanceiro: 4500,
      prazoHoras: 48,
      responsavel: 'Produtor',
      status: 'pendente',
      icone: '🎯'
    },
    {
      id: 3,
      tipo: 'rotina',
      titulo: 'Aplicação PGF2α - Lote 4',
      descricao: '8 animais no dia 18 do protocolo. Estoque disponível: 3 doses.',
      risco: 'Parada do protocolo se não comprar hoje',
      impactoFinanceiro: 1200,
      prazoHoras: 8,
      responsavel: 'Funcionário B',
      status: 'em_andamento',
      icone: '💉'
    }
  ],

  // 2. ALERTAS INTELIGENTES POR ANIMAL (A "IA" do sistema)
  alertasAnimais: [
    {
      id: '0523',
      lote: 'Lote 1',
      lactacao: '3ª',
      foto: null, // placeholder
      gravidade: 'critico',
      titulo: 'Repetição de Cio Suspeita',
      motivo: '3 cios observados, nenhuma inseminação registrada. Probabilidade de cisto ovariano: 78% baseada no histórico do lote.',
      risco: 'Anestro prolongado, perda de 210 dias produtivos',
      acaoRecomendada: 'Exame ultra-som hoje ou descarte da IATF',
      custoInacao: 3200,
      tags: ['Cisto provável', 'IATF falha']
    },
    {
      id: '0892',
      lote: 'Lote 3',
      lactacao: '2ª',
      gravidade: 'alto',
      titulo: 'CCS Explosiva Detectada',
      motivo: 'CCS saltou de 180k para 420k em 5 dias. Padrão similar resultou em mastite aguda em 72h no histórico da fazenda.',
      risco: 'Mastite aguda clínica + perda de lactação',
      acaoRecomendada: 'Separar imediatamente + antibiograma preventivo',
      custoInacao: 2800,
      tags: ['Subclínica avançando', 'Isolar hoje']
    },
    {
      id: '1041',
      lote: 'Lote 2',
      lactacao: '4ª',
      gravidade: 'medio',
      titulo: 'Janela IATF Fechando',
      motivo: 'Animal em dia 20 do protocolo. Se não houver cio até amanhã, perde a janela deste ciclo.',
      risco: 'Atraso reprodutivo de 21 dias',
      acaoRecomendada: 'Observação intensiva 06h/18h ou IATF forçada',
      custoInacao: 400,
      tags: ['Última chance', 'Observar']
    }
  ],

  // 3. CONTEXTO PRODUTIVO (Estimativa, não absoluto)
  contextoProducao: {
    estimativaHoje: 18450,
    metaDia: 18000,
    performance: 102.5,
    tendenciaSeteDias: [17500, 17800, 17600, 18200, 18300, 18100, 18450],
    diagnosticoSistema: 'Lote 3 compensando queda do Lote 1 (-8%). Se não tratar mastite hoje, projeção cai para 94% em 10 dias.',
    projecaoMensal: '+4.2% se mantiver ritmo de separação',
    fatorClimatico: 'Umidade subindo (68%). Histórico: +15% mastite em 48h.'
  },

  // 4. RISCOS PRÓXIMOS (Timeline)
  riscosTimeline: [
    { quando: '14:00', tipo: 'critico', titulo: 'Estoque PGF2α acaba', descricao: '3 doses apenas. Compra urgente.' },
    { quando: 'Amanhã 06h', tipo: 'alerta', titulo: 'IATF Lote 4', descricao: '8 animais aguardando. Sem estoque = parada.' },
    { quando: '3 dias', tipo: 'atencao', titulo: 'IPP Limite Lote 2', descricao: '3 animais atingem 420 dias simultaneamente.' },
    { quando: '5 dias', tipo: 'oportunidade', titulo: 'Venda Bezerros', descricao: 'Lote 5 atingiu peso ideal. Preço em alta (+8%).' }
  ]
};

// ===== COMPONENTES VISUAIS (Design System Dark Operacional) =====

const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>;
const IconClock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>;
const IconMoney = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h6a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconArrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>;

const GlassCard = ({ children, style = {}, gravidade = 'none' }) => {
  const bordas = {
    none: 'rgba(255,255,255,0.08)',
    critico: 'rgba(239,68,68,0.4)',
    alto: 'rgba(245,158,11,0.4)',
    medio: 'rgba(6,182,212,0.3)'
  };
  
  const glows = {
    none: 'none',
    critico: '0 0 20px rgba(239,68,68,0.15)',
    alto: '0 0 20px rgba(245,158,11,0.15)',
    medio: '0 0 20px rgba(6,182,212,0.1)'
  };

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${bordas[gravidade] || bordas.none}`,
      borderRadius: '20px',
      padding: '24px',
      boxShadow: `${glows[gravidade] || glows.none}, 0 8px 32px 0 rgba(0,0,0,0.3)`,
      position: 'relative',
      overflow: 'hidden',
      ...style
    }}>
      {children}
    </div>
  );
};

const StatusOrb = ({ gravidade, size = 8 }) => {
  const cores = {
    critico: '#EF4444',
    alto: '#F59E0B',
    medio: '#06B6D4',
    baixo: '#10B981'
  };
  
  return (
    <span style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: cores[gravidade] || cores.baixo,
      boxShadow: `0 0 10px ${cores[gravidade] || cores.baixo}`,
      display: 'inline-block',
      animation: gravidade === 'critico' ? 'pulse 2s infinite' : 'none'
    }} />
  );
};

const Tag = ({ children, tipo }) => {
  const cores = {
    perigo: { bg: 'rgba(239,68,68,0.15)', text: '#FCA5A5', border: 'rgba(239,68,68,0.3)' },
    alerta: { bg: 'rgba(245,158,11,0.15)', text: '#FCD34D', border: 'rgba(245,158,11,0.3)' },
    info: { bg: 'rgba(6,182,212,0.15)', text: '#67E8F9', border: 'rgba(6,182,212,0.3)' },
    sucesso: { bg: 'rgba(16,185,129,0.15)', text: '#6EE7B7', border: 'rgba(16,185,129,0.3)' }
  };
  
  const estilo = cores[tipo] || cores.info;
  
  return (
    <span style={{
      background: estilo.bg,
      color: estilo.text,
      border: `1px solid ${estilo.border}`,
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {children}
    </span>
  );
};

// ===== SEÇÕES PRINCIPAIS =====

const SecaoMissoes = ({ missoes, onToggle }) => {
  const [tempo, setTempo] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setTempo(Date.now()), 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  const formatarContagem = (horasRestantes) => {
    if (horasRestantes <= 0) return 'VENCIDO';
    if (horasRestantes < 1) return `${Math.floor(horasRestantes * 60)}min`;
    return `${horasRestantes}h`;
  };

  return (
    <GlassCard gravidade="critico" style={{ height: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(239,68,68,0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <StatusOrb gravidade="critico" size={10} />
            <span style={{ color: '#FCA5A5', fontSize: '13px', fontWeight: '800', letterSpacing: '0.1em' }}>
              OPERAÇÕES CRÍTICAS DO DIA
            </span>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>Execute em ordem de urgência</p>
        </div>
        <div style={{
          background: 'rgba(239,68,68,0.2)',
          color: '#FCA5A5',
          padding: '8px 16px',
          borderRadius: '12px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '14px',
          fontWeight: '700'
        }}>
          {missoes.filter(m => m.status !== 'concluido').length} PENDENTES
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {missoes.map((missao) => (
          <div key={missao.id} style={{
            background: missao.status === 'concluido' ? 'rgba(16,185,129,0.05)' : 'rgba(15,23,42,0.6)',
            border: `1px solid ${missao.status === 'concluido' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '16px',
            padding: '20px',
            opacity: missao.status === 'concluido' ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div onClick={() => onToggle(missao.id)} style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: `2px solid ${missao.status === 'concluido' ? '#10B981' : '#EF4444'}`,
                  background: missao.status === 'concluido' ? '#10B981' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  {missao.status === 'concluido' && <IconCheck />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{missao.icone}</span>
                    <span style={{ 
                      color: missao.tipo === 'critico' ? '#FCA5A5' : '#E2E8F0', 
                      fontWeight: '700', 
                      fontSize: '16px',
                      textDecoration: missao.status === 'concluido' ? 'line-through' : 'none'
                    }}>
                      {missao.titulo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IconClock /> {missao.responsavel}
                    </span>
                    <span>•</span>
                    <span style={{ 
                      color: missao.prazoHoras <= 3 ? '#EF4444' : '#F59E0B',
                      fontWeight: '700',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      {formatarContagem(missao.prazoHoras)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  background: 'rgba(239,68,68,0.15)', 
                  color: '#FCA5A5', 
                  padding: '6px 12px', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '4px'
                }}>
                  <IconMoney /> R$ {missao.impactoFinanceiro}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>se não executar</div>
              </div>
            </div>
            
            <p style={{ 
              margin: '0 0 12px 0', 
              color: '#94A3B8', 
              fontSize: '14px', 
              lineHeight: 1.5,
              paddingLeft: '36px'
            }}>
              {missao.descricao}
            </p>
            
            {missao.status !== 'concluido' && (
              <div style={{ 
                marginLeft: '36px',
                padding: '12px',
                background: 'rgba(239,68,68,0.1)', 
                borderLeft: '3px solid #EF4444',
                borderRadius: '0 8px 8px 0',
                color: '#FCA5A5',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>⚠️ {missao.risco}</span>
                <button style={{
                  background: 'rgba(239,68,68,0.2)',
                  color: '#FCA5A5',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Executar <IconArrow />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const SecaoInteligenciaAnimal = ({ alertas }) => {
  return (
    <GlassCard style={{ height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: '#8B5CF6',
            boxShadow: '0 0 10px #8B5CF6' 
          }} />
          <span style={{ color: '#C4B5FD', fontSize: '13px', fontWeight: '800', letterSpacing: '0.1em' }}>
            INTELIGÊNCIA ARTIFICIAL • PLANTEL
          </span>
        </div>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>Análise automática de riscos e oportunidades</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {alertas.map((animal) => (
          <div key={animal.id} style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.6) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              background: animal.gravidade === 'critico' ? '#EF4444' : animal.gravidade === 'alto' ? '#F59E0B' : '#06B6D4'
            }} />

            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Avatar do animal */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(139,92,246,0.2)',
                border: '2px solid rgba(139,92,246,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                🐄
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#F8FAFC', fontWeight: '800', fontSize: '18px', fontFamily: 'JetBrains Mono, monospace' }}>
                        #{animal.id}
                      </span>
                      <span style={{ color: '#64748B', fontSize: '13px' }}>{animal.lote} • {animal.lactacao}</span>
                    </div>
                    <h3 style={{ margin: 0, color: animal.gravidade === 'critico' ? '#FCA5A5' : '#FCD34D', fontSize: '15px', fontWeight: '700' }}>
                      {animal.titulo}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#EF4444', fontSize: '13px', fontWeight: '700', marginBottom: '2px' }}>
                      R$ {animal.custoInacao}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '11px' }}>custo de inação</div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#94A3B8', fontSize: '13px', lineHeight: 1.5 }}>
                    {animal.motivo}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {animal.tags.map((tag, idx) => (
                      <Tag key={idx} tipo={animal.gravidade === 'critico' ? 'perigo' : 'alerta'}>{tag}</Tag>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(15,23,42,0.8)',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#64748B', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Ação Recomendada
                      </div>
                      <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '600' }}>
                        {animal.acaoRecomendada}
                      </div>
                    </div>
                    <button style={{
                      background: animal.gravidade === 'critico' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                      color: animal.gravidade === 'critico' ? '#FCA5A5' : '#FCD34D',
                      border: `1px solid ${animal.gravidade === 'critico' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      marginLeft: '12px'
                    }}>
                      Ver Ficha <IconArrow />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const SecaoContextoProducao = ({ dados }) => {
  const sparklinePontos = dados.tendenciaSeteDias.map((v, i, arr) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const x = (i / (arr.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <GlassCard style={{ height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: '#06B6D4',
            boxShadow: '0 0 10px #06B6D4' 
          }} />
          <span style={{ color: '#67E8F9', fontSize: '13px', fontWeight: '800', letterSpacing: '0.1em' }}>
            CONTEXTO PRODUTIVO
          </span>
        </div>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px' }}>Estimativas e diagnóstico do sistema</p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          fontSize: '56px', 
          fontWeight: '800', 
          color: dados.performance >= 100 ? '#34D399' : '#F87171',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '-0.03em',
          textShadow: dados.performance >= 100 ? '0 0 30px rgba(52,211,153,0.3)' : '0 0 30px rgba(248,113,113,0.3)'
        }}>
          {dados.performance}%
        </div>
        <div style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>da meta diária</div>
        <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
          Estimativa: {(dados.estimativaHoje/1000).toFixed(1)}k L
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ marginBottom: '24px', height: '60px', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={sparklinePontos}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx="100" cy={sparklinePontos.split(',').pop()} r="4" fill="#06B6D4" />
        </svg>
        <div style={{ 
          position: 'absolute', 
          bottom: '0', 
          left: '0', 
          right: '0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '10px', 
          color: '#475569' 
        }}>
          <span>7 dias</span>
          <span>Hoje</span>
        </div>
      </div>

      <div style={{
        background: 'rgba(6,182,212,0.1)',
        border: '1px solid rgba(6,182,212,0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ color: '#06B6D4', fontSize: '11px', fontWeight: '800', marginBottom: '8px', letterSpacing: '0.05em' }}>
          💡 DIAGNÓSTICO DO SISTEMA
        </div>
        <p style={{ margin: 0, color: '#CFFAFE', fontSize: '14px', lineHeight: 1.5 }}>
          {dados.diagnosticoSistema}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <span style={{ color: '#64748B' }}>Projeção mensal</span>
          <span style={{ color: '#34D399', fontWeight: '700' }}>{dados.projecaoMensal}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <span style={{ color: '#64748B' }}>Fator climático</span>
          <span style={{ color: '#FCD34D', fontWeight: '600', fontSize: '12px' }}>{dados.fatorClimatico}</span>
        </div>
      </div>
    </GlassCard>
  );
};

const SecaoTimelineRiscos = ({ riscos }) => {
  return (
    <GlassCard style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '800', letterSpacing: '0.1em' }}>
          ⚠️ LINHA DO TEMPO DE RISCOS E OPORTUNIDADES
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
        {/* Trilha */}
        <div style={{ 
          position: 'relative', 
          flex: 1, 
          height: '2px', 
          background: 'rgba(255,255,255,0.1)', 
          minWidth: '600px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {riscos.map((risco, idx) => {
            const cores = {
              critico: '#EF4444',
              alerta: '#F59E0B',
              atencao: '#06B6D4',
              oportunidade: '#10B981'
            };
            
            return (
              <div key={idx} style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: cores[risco.tipo],
                  boxShadow: `0 0 15px ${cores[risco.tipo]}`,
                  zIndex: 2,
                  border: '2px solid #0B0F19'
                }} />
                
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  width: '180px',
                  textAlign: 'center',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}>
                  <div style={{ 
                    color: cores[risco.tipo], 
                    fontSize: '12px', 
                    fontWeight: '800',
                    marginBottom: '4px',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {risco.quando}
                  </div>
                  <div style={{ 
                    color: '#E2E8F0', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    marginBottom: '4px',
                    lineHeight: 1.3
                  }}>
                    {risco.titulo}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '11px', lineHeight: 1.4 }}>
                    {risco.descricao}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Espaçamento para o conteúdo absoluto dos cards */}
      <div style={{ height: '120px' }} />
    </GlassCard>
  );
};

// ===== COMPONENTE PRINCIPAL =====

export default function Inicio() {
  const [missoes, setMissoes] = useState(INTELIGENCIA_HOJE.missoes);
  const [horaAtual, setHoraAtual] = useState(INTELIGENCIA_HOJE.hora);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setHoraAtual(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleMissao = (id) => {
    setMissoes(prev => prev.map(m => 
      m.id === id ? { ...m, status: m.status === 'concluido' ? 'pendente' : 'concluido' } : m
    ));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #1e293b 0%, #0B0F19 50%, #020617 100%)',
      color: '#E2E8F0',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '24px 32px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background sutil */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* HEADER */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: '#64748B', 
                letterSpacing: '0.2em',
                fontWeight: '800'
              }}>
                SMARTCOW
              </h1>
              <span style={{ color: '#334155' }}>•</span>
              <span style={{ fontSize: '14px', color: '#94A3B8' }}>CENTRAL DE OPERAÇÕES</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '300', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              {INTELIGENCIA_HOJE.data}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: '800', 
              color: '#06B6D4',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '-0.03em',
              textShadow: '0 0 20px rgba(6,182,212,0.3)'
            }}>
              {horaAtual}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Ciclo de decisões ativo
            </div>
          </div>
        </header>

        {/* GRID PRINCIPAL */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.2fr 1.5fr 0.8fr', 
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Coluna 1: Missões Críticas (Principal) */}
          <SecaoMissoes missoes={missoes} onToggle={toggleMissao} />

          {/* Coluna 2: Inteligência Animal (Central) */}
          <SecaoInteligenciaAnimal alertas={INTELIGENCIA_HOJE.alertasAnimais} />

          {/* Coluna 3: Contexto Produção (Lateral) */}
          <SecaoContextoProducao dados={INTELIGENCIA_HOJE.contextoProducao} />
        </div>

        {/* Timeline de Riscos (Base) */}
        <SecaoTimelineRiscos riscos={INTELIGENCIA_HOJE.riscosTimeline} />

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700;800&display=swap');
        
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
}