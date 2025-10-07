import React, { useState, useEffect } from 'react';
import { Calendar, Plus, DollarSign, User, Building, Guitar as Hospital, CreditCard, UserCheck, Stethoscope, Scissors, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { dbHelpers } from '../lib/supabase';
import { Repasse, Medico, Convenio, Hospital as HospitalType } from '../types';
import { RepasseReport } from './Reports/RepasseReport';
import { EditRepasseModal } from './Modals/EditRepasseModal';
import { ConfirmDeleteModal } from './Modals/ConfirmDeleteModal';
import { useAuth } from './Auth/AuthContext';

export const RepasseComponent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'convenio' | 'particular'>('convenio');
  const [activeView, setActiveView] = useState<'form' | 'report'>('form');
  const [activeParticularForm, setActiveParticularForm] = useState<'consulta_onda' | 'infiltracao_cirurgia'>('consulta_onda');
  const [repasses, setRepasses] = useState<Repasse[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [hospitais, setHospitais] = useState<HospitalType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingRepasse, setEditingRepasse] = useState<Repasse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // NOVO ESTADO: Mês de Referência
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7); // 'YYYY-MM'
  });
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  const [formData, setFormData] = useState({
    medico_id: '',
    nome_paciente: '',
    data_cirurgia: '',
    tipo_procedimento: 'consulta' as 'consulta' | 'onda_choque' | 'infiltracao' | 'cirurgia',
    quantidade: '1',
    forma_pagamento: 'pix' as 'credito' | 'pix' | 'debito' | 'especie',
    valor_unitario: '',
    month_reference: '' // NOVO CAMPO
  });

  const [formDataConvenio, setFormDataConvenio] = useState({
    medico_id: '',
    convenio_id: '',
    nome_paciente: '',
    hospital_id: '',
    data_cirurgia: '',
    valor: '',
    tipo: 'consulta' as 'consulta' | 'cirurgia',
    month_reference: '' // NOVO CAMPO
  });

  // Carregar dados quando o mês selecionado mudar
  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  // Atualizar formData quando selectedMonth mudar
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      month_reference: selectedMonth
    }));
    setFormDataConvenio(prev => ({
      ...prev,
      month_reference: selectedMonth
    }));
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // MODIFICADO: Carregar repasses filtrando por month_reference
      const [repassesRes, medicosRes, conveniosRes, hospitaisRes] = await Promise.all([
        dbHelpers.getRepassesByMonth(selectedMonth), // Nova função
        dbHelpers.getMedicos(),
        dbHelpers.getConvenios(),
        dbHelpers.getHospitais()
      ]);

      if (repassesRes.data) setRepasses(repassesRes.data);
      if (medicosRes.data) setMedicos(medicosRes.data);
      if (conveniosRes.data) setConvenios(conveniosRes.data);
      if (hospitaisRes.data) setHospitais(hospitaisRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setLoading(false);
  };

  // FUNÇÃO NOVA: Gerar opções de meses
  const generateMonthOptions = () => {
    const months = [];
    const today = new Date();
    
    // Últimos 6 meses e próximos 3 meses
    for (let i = -6; i <= 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      months.push({ 
        value, 
        label: label.charAt(0).toUpperCase() + label.slice(1) 
      });
    }
    
    return months;
  };

  // FUNÇÃO NOVA: Formatar mês selecionado
  const formatSelectedMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      if (activeTab === 'convenio') {
        result = await dbHelpers.createRepasse({
          medico_id: parseInt(formDataConvenio.medico_id),
          convenio_id: parseInt(formDataConvenio.convenio_id),
          nome_paciente: formDataConvenio.nome_paciente,
          hospital_id: parseInt(formDataConvenio.hospital_id),
          data_cirurgia: formDataConvenio.data_cirurgia,
          valor: parseFloat(formDataConvenio.valor),
          tipo: formDataConvenio.tipo,
          is_particular: false,
          month_reference: formDataConvenio.month_reference // NOVO CAMPO
        });
      } else {
        // Para particulares, calcular valor total
        const valorTotal = parseFloat(formData.valor_unitario) * parseInt(formData.quantidade);
        const categoria = activeParticularForm === 'consulta_onda' ? 'consulta_onda' : 'infiltracao_cirurgia';
        const tipo = ['consulta', 'onda_choque'].includes(formData.tipo_procedimento) ? 'consulta' : 'cirurgia';
        
        // Garantir que temos um hospital válido
        let hospitalId = 1; // ID padrão para particulares
        if (hospitais.length > 0) {
          hospitalId = hospitais[0].id;
        }
        
        result = await dbHelpers.createRepasse({
          medico_id: parseInt(formData.medico_id),
          nome_paciente: formData.nome_paciente,
          hospital_id: hospitalId,
          data_cirurgia: formData.data_cirurgia,
          valor: valorTotal,
          tipo: tipo,
          is_particular: true,
          month_reference: formData.month_reference // NOVO CAMPO
        });
      }

      if (result.error) {
        console.error('Erro:', result.error);
      } else {
        // Reset form data
        setFormDataConvenio({
          medico_id: '',
          convenio_id: '',
          nome_paciente: '',
          hospital_id: '',
          data_cirurgia: '',
          valor: '',
          tipo: 'consulta',
          month_reference: selectedMonth // Reset para o mês atual
        });
        
        setFormData({
          medico_id: '',
          nome_paciente: '',
          data_cirurgia: '',
          tipo_procedimento: 'consulta',
          quantidade: '1',
          forma_pagamento: 'pix',
          valor_unitario: '',
          month_reference: selectedMonth // Reset para o mês atual
        });
        
        setShowForm(false);
        loadData();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
    setLoading(false);
  };

  const handleEdit = (repasse: Repasse) => {
    setEditingRepasse(repasse);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    
    setDeleteLoading(true);
    try {
      const result = await dbHelpers.deleteRepasse(deletingId);
      if (!result.error) {
        loadData();
        setDeletingId(null);
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
    setDeleteLoading(false);
  };

  const handleNew = () => {
    setShowForm(true);
    setActiveView('form');
  };

  // Verificar se o usuário tem acesso ao repasse particular
  const hasParticularAccess = user?.email === 'rayannyrego@gmail.com';

  const filteredRepasses = repasses.filter(repasse => 
    activeTab === 'convenio' ? !repasse.is_particular : repasse.is_particular
  );

  // Separar repasses particulares por categoria
  const repassesConsultaOnda = filteredRepasses.filter(r => r.categoria_particular === 'consulta_onda');
  const repassesInfiltracao = filteredRepasses.filter(r => r.categoria_particular === 'infiltracao_cirurgia');
  
  const totalConsultaOnda = repassesConsultaOnda.reduce((sum, item) => sum + item.valor, 0);
  const totalInfiltracao = repassesInfiltracao.reduce((sum, item) => sum + item.valor, 0);
  const totalPeriodo = activeTab === 'convenio' ? filteredRepasses.reduce((sum, item) => sum + item.valor, 0) : totalConsultaOnda + totalInfiltracao;

  // Calcular taxas para consulta/onda de choque (16,33% + taxa pagamento)
  const calcularTaxasConsultaOnda = () => {
    const taxaNotaFiscal = 0.1633; // 16,33%
    let totalTaxas = 0;
    
    repassesConsultaOnda.forEach(repasse => {
      let taxaPagamento = 0;
      switch (repasse.forma_pagamento) {
        case 'credito': taxaPagamento = 0.025; break; // 2,5%
        case 'debito': taxaPagamento = 0.018; break;  // 1,8%
        case 'pix':
        case 'especie': taxaPagamento = 0; break;     // 0%
      }
      totalTaxas += repasse.valor * (taxaNotaFiscal + taxaPagamento);
    });
    
    return totalTaxas;
  };

  // Calcular taxas para infiltração/cirurgia (10,93% + taxa pagamento)
  const calcularTaxasInfiltracao = () => {
    const taxaNotaFiscal = 0.1093; // 10,93%
    let totalTaxas = 0;
    
    repassesInfiltracao.forEach(repasse => {
      let taxaPagamento = 0;
      switch (repasse.forma_pagamento) {
        case 'credito': taxaPagamento = 0.025; break; // 2,5%
        case 'debito': taxaPagamento = 0.018; break;  // 1,8%
        case 'pix':
        case 'especie': taxaPagamento = 0; break;     // 0%
      }
      totalTaxas += repasse.valor * (taxaNotaFiscal + taxaPagamento);
    });
    
    return totalTaxas;
  };

  const taxasConsultaOnda = calcularTaxasConsultaOnda();
  const taxasInfiltracao = calcularTaxasInfiltracao();

  if (activeView === 'report') {
    return (
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('form')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            ← Voltar ao Formulário
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('convenio')}
              className={`py-3 px-6 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'convenio'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Building size={16} />
              Repasse por Convênio
            </button>
            {hasParticularAccess && (
              <button
                onClick={() => setActiveTab('particular')}
                className={`py-3 px-6 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                  activeTab === 'particular'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <UserCheck size={16} />
                Repasse Particular
              </button>
            )}
          </nav>
        </div>

        <RepasseReport
          activeTab={activeTab}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNew={handleNew}
          hasParticularAccess={hasParticularAccess}
          selectedMonth={selectedMonth} // NOVO: Passar o mês selecionado
        />

        <EditRepasseModal
          repasse={editingRepasse}
          isOpen={!!editingRepasse}
          onClose={() => setEditingRepasse(null)}
          onSave={loadData}
        />

        <ConfirmDeleteModal
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={confirmDelete}
          title="Excluir Repasse"
          message="Tem certeza que deseja excluir este registro de repasse? Esta ação não pode ser desfeita."
          loading={deleteLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - MODIFICADO */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Controle de Repasse</h2>
            
            {/* NOVO: Seletor de Mês */}
            <div className="relative mt-1">
              <button
                onClick={() => setShowMonthSelector(!showMonthSelector)}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-700">
                  {formatSelectedMonth(selectedMonth)}
                </span>
                {showMonthSelector ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showMonthSelector && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 w-48">
                  {generateMonthOptions().map(month => (
                    <button
                      key={month.value}
                      onClick={() => {
                        setSelectedMonth(month.value);
                        setShowMonthSelector(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                        month.value === selectedMonth 
                          ? 'bg-blue-100 text-blue-700 font-medium' 
                          : 'text-gray-700'
                      }`}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveView('report')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <BarChart3 size={20} />
            Relatório
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Novo Repasse
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('convenio')}
            className={`py-3 px-6 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
              activeTab === 'convenio'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Building size={16} />
            Repasse por Convênio
          </button>
          {hasParticularAccess && (
            <button
              onClick={() => setActiveTab('particular')}
              className={`py-3 px-6 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'particular'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <UserCheck size={16} />
              Repasse Particular
            </button>
          )}
        </nav>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            {activeTab === 'convenio' ? (
              <Building className="h-5 w-5 text-blue-600" />
            ) : (
              <UserCheck className="h-5 w-5 text-purple-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              Novo Repasse {activeTab === 'convenio' ? 'por Convênio' : 'Particular'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NOVO CAMPO: Mês de Referência */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Mês de Referência
                </div>
              </label>
              <select
                value={activeTab === 'convenio' ? formDataConvenio.month_reference : formData.month_reference}
                onChange={(e) => {
                  if (activeTab === 'convenio') {
                    setFormDataConvenio(prev => ({ ...prev, month_reference: e.target.value }));
                  } else {
                    setFormData(prev => ({ ...prev, month_reference: e.target.value }));
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione o mês de referência</option>
                {generateMonthOptions().map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Mês ao qual este repasse será contabilizado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Médico
              </label>
              <select
                value={activeTab === 'convenio' ? formDataConvenio.medico_id : formData.medico_id}
                onChange={(e) => {
                  if (activeTab === 'convenio') {
                    setFormDataConvenio(prev => ({ ...prev, medico_id: e.target.value }));
                  } else {
                    setFormData(prev => ({ ...prev, medico_id: e.target.value }));
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Selecione o médico</option>
                {medicos.map(medico => (
                  <option key={medico.id} value={medico.id}>{medico.nome}</option>
                ))}
              </select>
            </div>

            {activeTab === 'convenio' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Convênio
                </label>
                <select
                  value={formDataConvenio.convenio_id}
                  onChange={(e) => setFormDataConvenio(prev => ({ ...prev, convenio_id: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Selecione o convênio</option>
                  {convenios.map(convenio => (
                    <option key={convenio.id} value={convenio.id}>{convenio.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'particular' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={16} />
                    Tipo de Atendimento
                  </div>
                </label>
                <select
                  value={formData.tipo_procedimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo_procedimento: e.target.value as 'consulta' | 'onda_choque' | 'infiltracao' | 'cirurgia' }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="consulta">🩺 Consulta</option>
                  <option value="onda_choque">🌊 Onda de Choque</option>
                  <option value="infiltracao">💉 Infiltração</option>
                  <option value="cirurgia">✂️ Cirurgia</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Paciente
              </label>
              <input
                type="text"
                value={activeTab === 'convenio' ? formDataConvenio.nome_paciente : formData.nome_paciente}
                onChange={(e) => {
                  if (activeTab === 'convenio') {
                    setFormDataConvenio(prev => ({ ...prev, nome_paciente: e.target.value }));
                  } else {
                    setFormData(prev => ({ ...prev, nome_paciente: e.target.value }));
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {activeTab === 'convenio' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital
                </label>
                <select
                  value={formDataConvenio.hospital_id}
                  onChange={(e) => setFormDataConvenio(prev => ({ ...prev, hospital_id: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Selecione o hospital</option>
                  {hospitais.map(hospital => (
                    <option key={hospital.id} value={hospital.id}>{hospital.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Cirurgia
              </label>
              <input
                type="date"
                value={activeTab === 'convenio' ? formDataConvenio.data_cirurgia : formData.data_cirurgia}
                onChange={(e) => {
                  if (activeTab === 'convenio') {
                    setFormDataConvenio(prev => ({ ...prev, data_cirurgia: e.target.value }));
                  } else {
                    setFormData(prev => ({ ...prev, data_cirurgia: e.target.value }));
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {activeTab === 'convenio' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formDataConvenio.tipo}
                    onChange={(e) => setFormDataConvenio(prev => ({ ...prev, tipo: e.target.value as 'consulta' | 'cirurgia' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="consulta">Consulta</option>
                    <option value="cirurgia">Cirurgia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDataConvenio.valor}
                    onChange={(e) => setFormDataConvenio(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formData.forma_pagamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, forma_pagamento: e.target.value as 'credito' | 'pix' | 'debito' | 'especie' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="pix">PIX</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="especie">Espécie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Unitário
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_unitario}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_unitario: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Repasse'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Repasses {activeTab === 'convenio' ? 'por Convênio' : 'Particulares'} de {formatSelectedMonth(selectedMonth)}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Médico</th>
                {activeTab === 'convenio' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Convênio</th>
                )}
                {activeTab === 'convenio' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                )}
                {activeTab === 'particular' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                )}
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hospital</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Data</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRepasses.map((repasse, index) => (
                <tr key={repasse.id} className={`transition-colors duration-150 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <User size={14} className="text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{repasse.medico?.nome}</span>
                  </td>
                  {activeTab === 'convenio' && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-1.5 rounded-full">
                          <Building size={14} className="text-green-600" />
                        </div>
                        <span className="text-gray-700">{repasse.convenio?.nome}</span>
                      </div>
                    </td>
                  )}
                  {activeTab === 'convenio' && (
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                        repasse.tipo === 'cirurgia' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {repasse.tipo === 'cirurgia' ? (
                          <>
                            <Scissors size={12} />
                            Cirurgia
                          </>
                        ) : (
                          <>
                            <Stethoscope size={12} />
                            Consulta
                          </>
                        )}
                      </span>
                    </td>
                  )}
                  {activeTab === 'particular' && (
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                        repasse.tipo === 'cirurgia' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {repasse.tipo === 'cirurgia' ? (
                          <>
                            <Scissors size={12} />
                            Cirurgia
                          </>
                        ) : (
                          <>
                            <Stethoscope size={12} />
                            Consulta
                          </>
                        )}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-gray-700">{repasse.nome_paciente}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-1.5 rounded-full">
                        <Hospital size={14} className="text-purple-600" />
                      </div>
                      <span className="text-gray-700">{repasse.hospital?.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-700">{new Date(repasse.data_cirurgia).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-green-600 text-lg">R$ {repasse.valor.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
