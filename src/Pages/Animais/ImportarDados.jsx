import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, FileSpreadsheet, AlertCircle, Check, X, 
  RefreshCw, Download, ArrowRight, Search, Database,
  ChevronLeft, FileText, Settings, CheckCircle
} from 'lucide-react';

const SmartImport = () => {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Cores do SmartCow baseado nas suas screenshots
  const colors = {
    primary: '#3b82f6',
    primaryDark: '#1e40af',
    bgDark: '#0f172a',
    bgCard: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  const smartCowFields = [
    { key: 'brinco', label: 'Nº Brinco', required: true, synonyms: ['brinco', 'numero', 'número', 'id', 'identificacao', 'codigo', 'ear_tag'] },
    { key: 'nome', label: 'Nome', required: false, synonyms: ['nome', 'animal', 'nome_animal', 'apelido'] },
    { key: 'data_nascimento', label: 'Nascimento', required: true, type: 'date', synonyms: ['nascimento', 'data_nasc', 'dt_nasc', 'birth'] },
    { key: 'raca', label: 'Raça', required: false, synonyms: ['raca', 'raça', 'breed'] },
    { key: 'categoria', label: 'Categoria', required: false, synonyms: ['categoria', 'tipo', 'classificacao'] },
    { key: 'lote', label: 'Lote', required: false, synonyms: ['lote', 'lot', 'grupo', 'batch'] },
    { key: 'peso_atual', label: 'Peso (kg)', required: false, type: 'number', synonyms: ['peso', 'peso_atual', 'weight'] },
    { key: 'situacao', label: 'Situação', required: false, synonyms: ['situacao', 'situação', 'status', 'estado'] },
    { key: 'data_entrada', label: 'Entrada', required: false, type: 'date', synonyms: ['entrada', 'data_entrada', 'dt_entrada'] },
    { key: 'valor_compra', label: 'Valor', required: false, type: 'number', synonyms: ['valor', 'preco', 'custo'] }
  ];

  const findBestMatch = (headerName) => {
    const normalized = headerName.toLowerCase().trim().replace(/[_\s-]+/g, '_');
    let bestMatch = null;
    let bestScore = 0;
    
    smartCowFields.forEach(field => {
      field.synonyms.forEach(syn => {
        const similarity = calculateSimilarity(normalized, syn);
        if (similarity > bestScore && similarity > 0.6) {
          bestScore = similarity;
          bestMatch = field.key;
        }
      });
    });
    
    return bestMatch;
  };

  const calculateSimilarity = (str1, str2) => {
    if (str1 === str2) return 1.0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        matrix[i][j] = str2.charAt(i-1) === str1.charAt(j-1) 
          ? matrix[i-1][j-1] 
          : Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1);
      }
    }
    return matrix[str2.length][str1.length];
  };

  const processFile = (file) => {
    if (!file) return;
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(extension)) {
      alert('Formato inválido. Use CSV ou Excel.');
      return;
    }
    setFile(file);
    simulateDataParsing();
  };

  const simulateDataParsing = () => {
    const mockHeaders = ['Brinco_ELETRONICO', 'NomeAnimal', 'Dt_Nasc', 'Raca', 'LoteAtual', 'PesoKG', 'Status'];
    const mockData = [
      { Brinco_ELETRONICO: '1234', NomeAnimal: 'Mimosa', Dt_Nasc: '2020-03-15', Raca: 'Holandesa', LoteAtual: 'Lote A', PesoKG: '450', Status: 'Ativa' },
      { Brinco_ELETRONICO: '1235', NomeAnimal: 'Estrela', Dt_Nasc: '2019-07-20', Raca: 'Jersey', LoteAtual: 'Lote B', PesoKG: '380', Status: 'Ativa' },
      { Brinco_ELETRONICO: '1236', NomeAnimal: 'Luna', Dt_Nasc: '2021-01-10', Raca: 'Holandesa', LoteAtual: 'Lote A', PesoKG: '410', Status: 'Vendida' },
      { Brinco_ELETRONICO: '', NomeAnimal: 'Teste', Dt_Nasc: 'invalid', Raca: 'ND', LoteAtual: '', PesoKG: 'abc', Status: 'Ativa' },
    ];

    setHeaders(mockHeaders);
    setRawData(mockData);
    
    const autoMapping = {};
    mockHeaders.forEach(header => {
      const match = findBestMatch(header);
      if (match) autoMapping[header] = match;
    });
    setMapping(autoMapping);
    setStep('mapping');
  };

  const validateData = () => {
    const newErrors = [];
    rawData.forEach((row, index) => {
      const rowErrors = [];
      Object.entries(mapping).forEach(([header, fieldKey]) => {
        if (!fieldKey) return;
        const field = smartCowFields.find(f => f.key === fieldKey);
        const value = row[header];
        if (field?.required && (!value || value === '')) {
          rowErrors.push(`${field.label} obrigatório`);
        }
        if (field?.type === 'date' && value && isNaN(Date.parse(value))) {
          rowErrors.push(`${field.label} inválida`);
        }
        if (field?.type === 'number' && value && isNaN(parseFloat(value))) {
          rowErrors.push(`${field.label} deve ser número`);
        }
      });
      if (rowErrors.length > 0) newErrors.push({ row: index + 1, errors: rowErrors });
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleImport = () => {
    if (!validateData()) return;
    setStep('processing');
    let prog = 0;
    const interval = setInterval(() => {
      prog += 5;
      setProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setStep('success');
      }
    }, 100);
  };

  const steps = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'mapping', label: 'Mapeamento', icon: Settings },
    { id: 'preview', label: 'Preview', icon: Search },
    { id: 'processing', label: 'Importação', icon: Database },
    { id: 'success', label: 'Concluído', icon: CheckCircle }
  ];

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      marginBottom: '32px',
      borderBottom: `1px solid ${colors.border}`,
      paddingBottom: '24px'
    },
    breadcrumb: {
      color: colors.textMuted,
      fontSize: '14px',
      marginBottom: '8px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: '8px'
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: '16px'
    },
    stepsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: '800px',
      margin: '0 auto 48px auto',
      position: 'relative'
    },
    stepWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      flex: 1,
      position: 'relative',
      zIndex: 2
    },
    stepCircle: (isActive, isPast) => ({
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isActive ? colors.primary : isPast ? colors.success : colors.bgCard,
      border: `2px solid ${isActive ? colors.primary : isPast ? colors.success : colors.border}`,
      color: isActive || isPast ? 'white' : colors.textMuted,
      transition: 'all 0.3s'
    }),
    stepLabel: (isActive) => ({
      fontSize: '12px',
      fontWeight: '600',
      color: isActive ? colors.primary : colors.textMuted
    }),
    connector: (isPast) => ({
      position: 'absolute',
      top: '24px',
      left: '50%',
      width: '100%',
      height: '2px',
      backgroundColor: isPast ? colors.success : colors.border,
      zIndex: 1,
      transform: 'translateX(-50%)'
    }),
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      padding: '32px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    uploadZone: (dragging) => ({
      border: `2px dashed ${dragging ? colors.primary : colors.border}`,
      borderRadius: '12px',
      padding: '48px',
      textAlign: 'center',
      backgroundColor: dragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      transition: 'all 0.3s',
      cursor: 'pointer',
      marginBottom: '24px'
    }),
    button: (variant = 'primary') => ({
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      backgroundColor: variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.bgCard,
      color: 'white',
      border: variant === 'outline' ? `1px solid ${colors.border}` : 'none',
      marginRight: '12px'
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px',
      marginTop: '24px'
    },
    featureCard: {
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '16px',
      fontSize: '14px'
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      borderBottom: `1px solid ${colors.border}`,
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: '12px',
      textTransform: 'uppercase'
    },
    td: {
      padding: '12px',
      borderBottom: `1px solid ${colors.border}`,
      color: colors.text
    },
    select: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: '6px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.bgDark,
      color: colors.text,
      fontSize: '14px'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: colors.border,
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '16px'
    },
    progressFill: (progress) => ({
      width: `${progress}%`,
      height: '100%',
      backgroundColor: colors.success,
      transition: 'width 0.3s ease'
    })
  };

  const renderUpload = () => (
    <div>
      <div 
        style={styles.uploadZone(isDragging)}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processFile(e.dataTransfer.files[0]);
        }}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <div style={{ 
          width: '64px', 
          height: '64px', 
          backgroundColor: 'rgba(59, 130, 246, 0.2)', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Upload size={32} color={colors.primary} />
        </div>
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Arraste seu arquivo aqui</h3>
        <p style={{ color: colors.textMuted, marginBottom: '16px' }}>
          ou clique para selecionar (CSV, XLSX, XLS)
        </p>
        <input 
          id="fileInput" 
          type="file" 
          accept=".csv,.xlsx,.xls" 
          style={{ display: 'none' }}
          onChange={(e) => processFile(e.target.files[0])}
        />
      </div>

      <div style={styles.grid}>
        <div style={styles.featureCard} onClick={() => {
          const csv = smartCowFields.map(f => f.synonyms[0]).join(',');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'template_smartcow.csv';
          a.click();
        }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: 'rgba(16, 185, 129, 0.2)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Download size={24} color={colors.success} />
          </div>
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>Baixar Template</h4>
            <p style={{ fontSize: '14px', color: colors.textMuted }}>Modelo padrão do sistema</p>
          </div>
        </div>

        <div style={styles.featureCard}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: 'rgba(245, 158, 11, 0.2)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} color={colors.warning} />
          </div>
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>Mapeamento Inteligente</h4>
            <p style={{ fontSize: '14px', color: colors.textMuted }}>Reconhece colunas automaticamente</p>
          </div>
        </div>

        <div style={styles.featureCard}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: 'rgba(239, 68, 68, 0.2)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={24} color={colors.danger} />
          </div>
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>Validação em Tempo Real</h4>
            <p style={{ fontSize: '14px', color: colors.textMuted }}>Detecta erros antes de importar</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMapping = () => (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>Mapeamento de Colunas</h3>
          <p style={{ color: colors.textMuted, fontSize: '14px' }}>
            Revise o mapeamento automático detectado
          </p>
        </div>
        <div style={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.2)', 
          color: colors.success,
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {Object.keys(mapping).length} de {headers.length} colunas mapeadas
        </div>
      </div>

      <div style={{ maxHeight: '400px', overflow: 'auto', marginBottom: '24px' }}>
        {headers.map((header) => {
          const mappedField = smartCowFields.find(f => f.key === mapping[header]);
          return (
            <div key={header} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '16px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: mappedField ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: colors.bgDark,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: mappedField ? colors.success : colors.textMuted
                }}>
                  {header.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>{header}</div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>Coluna do arquivo</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ArrowRight size={20} color={colors.textMuted} />
                <select 
                  style={{ ...styles.select, width: '220px' }}
                  value={mapping[header] || ''}
                  onChange={(e) => setMapping({...mapping, [header]: e.target.value})}
                >
                  <option value="">Ignorar coluna</option>
                  {smartCowFields.map(field => (
                    <option key={field.key} value={field.key}>
                      {field.label} {field.required ? '*' : ''}
                    </option>
                  ))}
                </select>
                {mappedField?.required && (
                  <span style={{ color: colors.danger, fontSize: '12px', fontWeight: '600' }}>Obrigatório</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          style={{ ...styles.button('outline'), color: colors.text }}
          onClick={() => setStep('upload')}
        >
          <ChevronLeft size={20} />
          Voltar
        </button>
        
        <div>
          <button 
            style={{ ...styles.button('outline'), color: colors.text, marginRight: '12px' }}
            onClick={() => {
              const newMapping = {};
              headers.forEach(h => {
                const match = findBestMatch(h);
                if (match) newMapping[h] = match;
              });
              setMapping(newMapping);
            }}
          >
            <RefreshCw size={16} />
            Remapear Auto
          </button>
          <button 
            style={styles.button('primary')}
            onClick={() => setStep('preview')}
            disabled={Object.keys(mapping).length === 0}
          >
            Continuar
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>Preview dos Dados</h3>
          <p style={{ color: colors.textMuted, fontSize: '14px' }}>
            {rawData.length} registros • {errors.length} com erro
          </p>
        </div>
        
        <input 
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...styles.select, width: '250px' }}
        />
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '500px', marginBottom: '24px', border: `1px solid ${colors.border}`, borderRadius: '8px' }}>
        <table style={styles.table}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: colors.bgCard }}>
            <tr>
              <th style={styles.th}>#</th>
              {Object.entries(mapping).filter(([_, v]) => v).map(([header, fieldKey]) => {
                const field = smartCowFields.find(f => f.key === fieldKey);
                return (
                  <th key={header} style={styles.th}>
                    <div style={{ fontSize: '10px', color: colors.textMuted, textTransform: 'uppercase' }}>{header}</div>
                    <div style={{ color: colors.text }}>{field?.label}</div>
                  </th>
                );
              })}
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rawData
              .filter(row => !searchTerm || Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase())))
              .map((row, idx) => {
                const rowError = errors.find(e => e.row === idx + 1);
                return (
                  <tr key={idx} style={{ backgroundColor: rowError ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                    <td style={{ ...styles.td, color: colors.textMuted }}>{idx + 1}</td>
                    {Object.entries(mapping).filter(([_, v]) => v).map(([header]) => (
                      <td key={header} style={{ 
                        ...styles.td,
                        color: rowError?.errors.some(e => e.includes(smartCowFields.find(f => f.key === mapping[header])?.label)) ? colors.danger : colors.text
                      }}>
                        {row[header] || '-'}
                      </td>
                    ))}
                    <td style={styles.td}>
                      {rowError ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <AlertCircle size={20} color={colors.danger} />
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '100%', 
                            right: 0, 
                            backgroundColor: colors.danger,
                            color: 'white',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            marginBottom: '8px',
                            display: 'none'
                          }} className="tooltip-content">
                            {rowError.errors.join(', ')}
                          </div>
                        </div>
                      ) : (
                        <CheckCircle size={20} color={colors.success} />
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {errors.length > 0 && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: `1px solid ${colors.danger}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle color={colors.danger} />
          <div>
            <strong style={{ color: colors.danger }}>{errors.length} registros com erro</strong>
            <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0 }}>
              Corrija no arquivo original ou remova para continuar
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          style={{ ...styles.button('outline'), color: colors.text }}
          onClick={() => setStep('mapping')}
        >
          <ChevronLeft size={20} />
          Voltar
        </button>
        
        <div>
          <button 
            style={{ ...styles.button('outline'), color: colors.danger, marginRight: '12px' }}
            onClick={() => setRawData(rawData.filter((_, idx) => !errors.find(e => e.row === idx + 1)))}
          >
            <X size={16} />
            Remover {errors.length} com erro
          </button>
          <button 
            style={styles.button('primary')}
            onClick={handleImport}
            disabled={errors.length === rawData.length}
          >
            <Database size={16} />
            Importar {rawData.length - errors.length} Animais
          </button>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div style={{ textAlign: 'center', padding: '64px' }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        margin: '0 auto 24px',
        position: 'relative'
      }}>
        <RefreshCw size={80} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Importando dados...</h3>
      <p style={{ color: colors.textMuted, marginBottom: '24px' }}>
        Processando {rawData.length} registros
      </p>
      <div style={styles.progressBar}>
        <div style={styles.progressFill(progress)} />
      </div>
      <p style={{ marginTop: '16px', color: colors.textMuted }}>{progress}%</p>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const renderSuccess = () => (
    <div style={{ textAlign: 'center', padding: '48px' }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <CheckCircle size={40} color={colors.success} />
      </div>
      
      <h3 style={{ fontSize: '28px', marginBottom: '8px' }}>Importação Concluída!</h3>
      <p style={{ color: colors.textMuted, marginBottom: '32px' }}>
        {rawData.length} animais importados com sucesso
      </p>

      <div style={{ 
        backgroundColor: colors.bgDark,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        margin: '0 auto 32px',
        textAlign: 'left'
      }}>
        <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Resumo</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span style={{ color: colors.textMuted }}>Total:</span>
          <span>{rawData.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span style={{ color: colors.textMuted }}>Importados:</span>
          <span style={{ color: colors.success }}>{rawData.length - errors.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <span style={{ color: colors.textMuted }}>Pulados:</span>
          <span style={{ color: errors.length ? colors.danger : colors.success }}>{errors.length}</span>
        </div>
      </div>

      <button 
        style={styles.button('primary')}
        onClick={() => {
          setStep('upload');
          setFile(null);
          setRawData([]);
          setMapping({});
          setErrors([]);
          setProgress(0);
        }}
      >
        Importar Outro Arquivo
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.breadcrumb}>SmartCow / Animais / Importação</div>
        <h1 style={styles.title}>Importação Inteligente de Dados</h1>
        <p style={styles.subtitle}>Migre seus animais de outro sistema de forma automática e inteligente</p>
      </div>

      {/* Steps */}
      <div style={styles.stepsContainer}>
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isPast = steps.indexOf(steps.find(x => x.id === step)) > idx;
          
          return (
            <React.Fragment key={s.id}>
              <div style={styles.stepWrapper}>
                <div style={styles.stepCircle(isActive, isPast)}>
                  <Icon size={20} />
                </div>
                <span style={styles.stepLabel(isActive)}>{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ ...styles.connector(isPast), left: `${((idx + 1) / (steps.length - 1)) * 100}%` }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Content */}
      <div style={styles.card}>
        {step === 'upload' && renderUpload()}
        {step === 'mapping' && renderMapping()}
        {step === 'preview' && renderPreview()}
        {step === 'processing' && renderProcessing()}
        {step === 'success' && renderSuccess()}
      </div>
    </div>
  );
};

export default SmartImport;