import React, { useState, useEffect } from 'react';
import { FileText, User, Calendar, DollarSign, Building, Pencil, Trash2, Plus, Filter, Printer, TrendingUp, Stethoscope, Scissors } from 'lucide-react';
import { dbHelpers } from '../../lib/supabase';
import { ProducaoMensal, Medico, Convenio } from '../../types';
import { supabase } from '../../lib/supabase';

interface ProducaoReportProps {
  onEdit: (producao: ProducaoMensal) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}

export const ProducaoReport: React.FC<ProducaoReportProps> = ({ onEdit, onDelete, onNew }) => {
  const [producoes, setProducoes] = useState<ProducaoMensal[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [selectedMedico, setSelectedMedico] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [selectedMedico, selectedTipo, dataInicio, dataFim]);

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

  const filterData = async () => {
    if (!selectedMedico && !selectedTipo && !dataInicio && !dataFim) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('producao_mensal')
        .select(`
          *,
          medico:medicos(*),
          convenio:convenios(*)
        `);

      if (selectedMedico) {
        query = query.eq('medico_id', parseInt(selectedMedico));
      }

      if (selectedTipo) {
        query = query.eq('tipo', selectedTipo);
      }

      if (dataInicio) {
        query = query.gte('data_consulta', dataInicio);
      }

      if (dataFim) {
        query = query.lte('data_consulta', dataFim);
      }

      const { data } = await query.order('data_consulta', { ascending: false });
      if (data) setProducoes(data);
    } catch (error) {
      console.error('Erro ao filtrar dados:', error);
    }
    setLoading(false);
  };

  const filteredProducoes = producoes;

  const totalGeral = filteredProducoes.reduce((sum, item) => sum + item.valor, 0);
  const cincoPorCentoTotal = totalGeral * 0.05;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const dateOnly = dateString.split('T')[0];
    if (dateOnly.includes('-')) {
      const [year, month, day] = dateOnly.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('relatorio-producao');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Relatório de Produção Mensal</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
                .total { font-weight: bold; margin-top: 20px; }
                .print\\:hidden { display: none !important; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Relatório de Produção Mensal</h1>
                <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                ${selectedMedico ? `<p>Médico: ${medicos.find(m => m.id === parseInt(selectedMedico))?.nome}</p>` : ''}
                ${selectedTipo ? `<p>Tipo: ${selectedTipo === 'consulta' ? 'Consultas' : 'Cirurgias'}</p>` : ''}
                ${dataInicio || dataFim ? `<p>Período: ${dataInicio ? formatDate(dataInicio) : 'Início'} até ${dataFim ? formatDate(dataFim) : 'Fim'}</p>` : ''}
              </div>
              ${printContent.innerHTML}
              <div class="total">
                <p>Total Geral: R$ ${totalGeral.toFixed(2)}</p>
                <p>5% do Total: R$ ${cincoPorCentoTotal.toFixed(2)}</p>
                <p>Quantidade de Consultas: ${filteredProducoes.length}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Relatório de Produção Mensal</h3>
              <p className="text-blue-100">Visualize e gerencie a produção médica</p>
            </div>
          </div>
          <button
            onClick={onNew}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 backdrop-blur-sm"
          >
            <Plus size={20} />
            Nova Consulta
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Arrecadado</p>
              <p className="text-2xl font-bold">R$ {totalGeral.toFixed(2)}</p>
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
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">5% do Total</p>
              <p className="text-2xl font-bold">R$ {cincoPorCentoTotal.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-gray-600" />
            </div>
            <span className="font-semibold text-gray-800">Filtros:</span>
          </div>
          <div className="flex gap-4 flex-1 flex-wrap">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
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
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                <option value="consulta">🩺 Consulta</option>
                <option value="cirurgia">✂️ Cirurgia</option>
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Data início"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Data fim"
              />
              </div>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg"
          >
            <Printer size={20} />
            Imprimir
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100" id="relatorio-producao">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-gray-900">Registros de Produção</h4>
            <div className="text-sm text-gray-500">
              {filteredProducoes.length} registro{filteredProducoes.length !== 1 ? 's' : ''} encontrado{filteredProducoes.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-800">Médico</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-800">Convênio</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-800">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-800">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-800">Data Atendimento</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-800">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-800 print:hidden">Ações</th>
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
              ) : filteredProducoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-12 w-12 text-gray-300" />
                      <span className="text-lg font-medium">Nenhum registro encontrado</span>
                      <span className="text-sm">Tente ajustar os filtros ou adicione novos registros</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducoes.map((producao) => (
                  <tr key={producao.id} className="transition-colors duration-150 hover:bg-blue-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full print:hidden">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{producao.medico?.nome}</div>
                          {producao.medico?.crm && (
                            <div className="text-xs text-gray-500">CRM: {producao.medico.crm}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-1.5 rounded-full print:hidden">
                          <Building size={14} className="text-green-600" />
                        </div>
                        <span className="font-medium text-gray-700">{producao.convenio?.nome}</span>
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
                            <Scissors size={12} className="print:hidden" />
                            Cirurgia
                          </>
                        ) : (
                          <>
                            <Stethoscope size={12} className="print:hidden" />
                            Consulta
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{producao.nome_paciente}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 print:hidden" />
                        <span className="font-medium text-gray-700">{formatDate(producao.data_consulta)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-green-100 px-3 py-1 rounded-full w-fit">
                        <span className="font-bold text-green-700 text-sm">R$ {producao.valor.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(producao)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 hover:scale-110"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(producao.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200 hover:scale-110"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Summary */}
        {filteredProducoes.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Exibindo {filteredProducoes.length} registro{filteredProducoes.length !== 1 ? 's' : ''}
                {selectedMedico && ` para ${medicos.find(m => m.id === parseInt(selectedMedico))?.nome}`}
                {selectedTipo && ` - ${selectedTipo === 'consulta' ? 'Consultas' : 'Cirurgias'}`}
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    Total: R$ {totalGeral.toFixed(2)}
                  </div>
                </div>
                <div className="text-right bg-purple-100 px-4 py-2 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">5% do Total</div>
                  <div className="text-lg font-bold text-purple-700">
                    R$ {cincoPorCentoTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};