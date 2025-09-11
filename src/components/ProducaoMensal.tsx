import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  DollarSign,
  User,
  Building,
  TrendingUp,
  FileText,
  BarChart3,
  Stethoscope,
  Scissors
} from 'lucide-react';
import { dbHelpers } from '../lib/supabase';
import { ProducaoMensal, Medico, Convenio } from '../types';
import { ProducaoReport } from './Reports/ProducaoReport';
import { EditProducaoModal } from './Modals/EditProducaoModal';
import { ConfirmDeleteModal } from './Modals/ConfirmDeleteModal';

export const ProducaoMensalComponent: React.FC = () => {
  const [activeView, setActiveView] = useState<'form' | 'report'>('form');
  const [producoes, setProducoes] = useState<ProducaoMensal[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingProducao, setEditingProducao] = useState<ProducaoMensal | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<string>('');
  const [formData, setFormData] = useState({
    medico_id: '',
    convenio_id: '',
    nome_paciente: '',
    data_consulta: '',
    valor: '',
    tipo: 'consulta' as 'consulta' | 'cirurgia'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [producaoRes, medicosRes, conveniosRes] = await Promise.all([
        dbHelpers.getProducaoMensal(),
        dbHelpers.getMedicos(),
        dbHelpers.getConvenios()
      ]);

      if (producaoRes.data) setProducoes(producaoRes.data);
      if (medicosRes.data) setMedicos(medicosRes.data);
      if (conveniosRes.data) setConvenios(conveniosRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await dbHelpers.createProducaoMensal({
        medico_id: parseInt(formData.medico_id),
        convenio_id: parseInt(formData.convenio_id),
        nome_paciente: formData.nome_paciente,
        data_consulta: formData.data_consulta,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo
      });

      if (result.error) {
        console.error('Erro:', result.error);
      } else {
        setFormData({
          medico_id: '',
          convenio_id: '',
          nome_paciente: '',
          data_consulta: '',
          valor: '',
          tipo: 'consulta'
        });
        setShowForm(false);
        loadData();
      }
    } catch (error) {
      console.error('Erro ao salvar produção:', error);
    }

    setLoading(false);
  };

  const handleEdit = (producao: ProducaoMensal) => {
    setEditingProducao(producao);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    setDeleteLoading(true);
    try {
      const result = await dbHelpers.deleteProducaoMensal(deletingId);
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

  // Filtrar produções por médico selecionado
  const filteredProducoes = selectedMedico 
    ? producoes.filter(p => p.medico_id === parseInt(selectedMedico))
    : producoes;

  // Calcular totais
  const totalPeriodo = producoes.reduce((sum, item) => sum + item.valor, 0);
  const totalMedicoSelecionado = filteredProducoes.reduce((sum, item) => sum + item.valor, 0);
  const cincoPorCentoMedico = totalMedicoSelecionado * 0.05;

  // Função para formatar data corretamente (evita problema de timezone)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Se a data já tem formato YYYY-MM-DD, converte diretamente
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  if (activeView === 'report') {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('form')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            ← Voltar ao Formulário
          </button>
        </div>

        <ProducaoReport
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNew={handleNew}
        />

        <EditProducaoModal
          producao={editingProducao}
          isOpen={!!editingProducao}
          onClose={() => setEditingProducao(null)}
          onSave={loadData}
        />

        <ConfirmDeleteModal
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={confirmDelete}
          title="Excluir Produção"
          message="Tem certeza que deseja excluir este registro de produção? Esta ação não pode ser desfeita."
          loading={deleteLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Produção Mensal</h2>
            <p className="text-gray-600">
              Controle de consultas e produção médica
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setActiveView('report')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <BarChart3 size={20} />
            Relatório
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Nova Consulta
          </button>
        </div>
      </div>

      {/* Filtro por médico */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-semibold text-gray-800">Filtrar por Médico:</span>
          </div>
          <div className="max-w-xs">
            <select
              value={selectedMedico}
              onChange={(e) => setSelectedMedico(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os médicos</option>
              {medicos.map(medico => (
                <option key={medico.id} value={medico.id}>{medico.nome}</option>
              ))}
            </select>
          </div>
          {selectedMedico && (
            <button
              onClick={() => setSelectedMedico('')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              Limpar Filtro
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                {selectedMedico ? 'Total do Médico' : 'Total Geral'}
              </p>
              <p className="text-2xl font-bold">
                R$ {selectedMedico ? totalMedicoSelecionado.toFixed(2) : totalPeriodo.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Consultas</p>
              <p className="text-2xl font-bold">{filteredProducoes.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        {selectedMedico && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">5% do Total</p>
                <p className="text-2xl font-bold">R$ {cincoPorCentoMedico.toFixed(2)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        )}
        
        {!selectedMedico && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Média por Consulta</p>
                <p className="text-2xl font-bold">R$ {producoes.length > 0 ? (totalPeriodo / producoes.length).toFixed(2) : '0.00'}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        )}
      </div>
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Nova Consulta</h3>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Convênio
              </label>
              <select
                value={formData.convenio_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, convenio_id: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Selecione o convênio</option>
                {convenios.map((convenio) => (
                  <option key={convenio.id} value={convenio.id}>
                    {convenio.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Atendimento
              </label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tipo: e.target.value as 'consulta' | 'cirurgia' }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="consulta">🩺 Consulta</option>
                <option value="cirurgia">✂️ Cirurgia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Paciente
              </label>
              <input
                type="text"
                value={formData.nome_paciente}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome_paciente: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
                placeholder="Nome completo do paciente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data do Atendimento
              </label>
              <input
                type="date"
                value={formData.data_consulta}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, data_consulta: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, valor: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
                placeholder="0,00"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Salvar Consulta
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Produções Recentes */}
      {!showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                {selectedMedico 
                  ? `Produções de ${medicos.find(m => m.id === parseInt(selectedMedico))?.nome}` 
                  : 'Produções Recentes'
                }
              </h4>
              <div className="text-sm text-gray-500">
                {filteredProducoes.length} registro{filteredProducoes.length !== 1 ? 's' : ''} encontrado{filteredProducoes.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Médico</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Convênio</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Paciente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Carregando dados...</span>
                      </div>
                    </td>
                  </tr>
                ) : producoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <span className="text-lg font-medium">Nenhuma produção cadastrada</span>
                        <span className="text-sm">Clique em "Nova Consulta" para começar</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducoes.slice(0, 10).map((producao, index) => (
                    <tr key={producao.id} className={`transition-colors duration-150 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-1.5 rounded-full">
                            <User size={14} className="text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{producao.medico?.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-1.5 rounded-full">
                            <Building size={14} className="text-green-600" />
                          </div>
                          <span className="text-gray-700">{producao.convenio?.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          producao.tipo === 'cirurgia' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {producao.tipo === 'cirurgia' ? (
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
                      <td className="px-6 py-4 text-gray-700">{producao.nome_paciente}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-700">{formatDate(producao.data_consulta)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-600 text-lg">R$ {producao.valor.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer com totais quando médico selecionado */}
          {selectedMedico && filteredProducoes.length > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total de {filteredProducoes.length} consulta{filteredProducoes.length !== 1 ? 's' : ''} para {medicos.find(m => m.id === parseInt(selectedMedico))?.nome}
                </div>
                <div className="flex gap-6 items-center">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      Total: R$ {totalMedicoSelecionado.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right bg-purple-100 px-4 py-2 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">5% do Total</div>
                    <div className="text-lg font-bold text-purple-700">
                      R$ {cincoPorCentoMedico.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {filteredProducoes.length > 10 && (
            <div className="p-4 text-center border-t border-gray-200">
              <button
                onClick={() => setActiveView('report')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todos os {filteredProducoes.length} registros no relatório →
              </button>
            </div>
          )}
        </div>
      )}

      <EditProducaoModal
        producao={editingProducao}
        isOpen={!!editingProducao}
        onClose={() => setEditingProducao(null)}
        onSave={loadData}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Excluir Produção"
        message="Tem certeza que deseja excluir este registro de produção? Esta ação não pode ser desfeita."
        loading={deleteLoading}
      />
    </div>
  );
};
