import React, { useState, useEffect } from 'react';
import { CreditCard, User, Calendar, DollarSign, Building, Edit, Trash2, Plus, Filter, Stethoscope, Scissors, Printer, TrendingUp } from 'lucide-react';
import { dbHelpers } from '../../lib/supabase';
import { Repasse, Medico, Convenio, Hospital } from '../../types';
import { supabase } from '../../lib/supabase';

interface RepasseReportProps {
  activeTab: 'convenio' | 'particular';
  onEdit: (repasse: Repasse) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}

export const RepasseReport: React.FC<RepasseReportProps> = ({ activeTab, onEdit, onDelete, onNew }) => {
  const [repasses, setRepasses] = useState<Repasse[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [hospitais, setHospitais] = useState<Hospital[]>([]);
  const [selectedMedico, setSelectedMedico] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [selectedMedico, activeTab, dataInicio, dataFim]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [repassesRes, medicosRes, conveniosRes, hospitaisRes] = await Promise.all([
        dbHelpers.getRepasses(),
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

  const filterData = async () => {
    if (!selectedMedico && !dataInicio && !dataFim) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('repasses')
        .select(`
          *,
          medico:medicos(*),
          convenio:convenios(*),
          hospital:hospitais(*)
        `);

      if (selectedMedico) {
        query = query.eq('medico_id', parseInt(selectedMedico));
      }

      if (dataInicio) {
        query = query.gte('data_cirurgia', dataInicio);
      }

      if (dataFim) {
        query = query.lte('data_cirurgia', dataFim);
      }

      const { data } = await query.order('data_cirurgia', { ascending: false });
      if (data) setRepasses(data);
    } catch (error) {
      console.error('Erro ao filtrar dados:', error);
    }
    setLoading(false);
  };

  const filteredRepasses = repasses.filter(repasse => {
    const matchesTab = activeTab === 'convenio' ? !repasse.is_particular : repasse.is_particular;
    const matchesMedico = selectedMedico ? repasse.medico_id === parseInt(selectedMedico) : true;
    return matchesTab && matchesMedico;
  });

  const totalGeral = filteredRepasses.reduce((sum, item) => sum + item.valor, 0);

  const handlePrint = () => {
    const printContent = document.getElementById('relatorio-repasse');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Relatório de Repasse ${activeTab === 'convenio' ? 'por Convênio' : 'Particular'}</title>
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
                <h1>Relatório de Repasse ${activeTab === 'convenio' ? 'por Convênio' : 'Particular'}</h1>
                <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                ${selectedMedico ? `<p>Médico: ${medicos.find(m => m.id === parseInt(selectedMedico))?.nome}</p>` : ''}
                ${dataInicio || dataFim ? `<p>Período: ${dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} até ${dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Fim'}</p>` : ''}
              </div>
              ${printContent.innerHTML}
              <div class="total">
                <p>Total Geral: R$ ${totalGeral.toFixed(2)}</p>
                <p>Quantidade de Repasses: ${filteredRepasses.length}</p>
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
      <div className={`rounded-xl p-6 text-white shadow-lg ${
            activeTab === 'convenio' 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
              : 'bg-gradient-to-r from-purple-600 to-purple-700'
          }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <CreditCard className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                Relatório de Repasse {activeTab === 'convenio' ? 'por Convênio' : 'Particular'}
              </h3>
              <p className={`${activeTab === 'convenio' ? 'text-blue-100' : 'text-purple-100'}`}>
                Visualize e gerencie os repasses médicos
              </p>
            </div>
          </div>
          <button
            onClick={onNew}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 backdrop-blur-sm"
          >
            <Plus size={20} />
            Novo Repasse
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-xl p-6 text-white shadow-lg ${
          activeTab === 'convenio' 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                activeTab === 'convenio' ? 'text-green-100' : 'text-emerald-100'
              }`}>Total Arrecadado</p>
              <p className="text-2xl font-bold">R$ {totalGeral.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className={`rounded-xl p-6 text-white shadow-lg ${
          activeTab === 'convenio' 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
            : 'bg-gradient-to-r from-purple-500 to-purple-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                activeTab === 'convenio' ? 'text-blue-100' : 'text-purple-100'
              }`}>Total de Repasses</p>
              <p className="text-2xl font-bold">{filteredRepasses.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className={`rounded-xl p-6 text-white shadow-lg ${
          activeTab === 'convenio' 
            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' 
            : 'bg-gradient-to-r from-pink-500 to-pink-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                activeTab === 'convenio' ? 'text-indigo-100' : 'text-pink-100'
              }`}>Média por Repasse</p>
              <p className="text-2xl font-bold">R$ {filteredRepasses.length > 0 ? (totalGeral / filteredRepasses.length).toFixed(2) : '0.00'}</p>
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100" id="relatorio-repasse">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-gray-900">Registros de Repasse</h4>
            <div className="text-sm text-gray-500">
              {filteredRepasses.length} registro{filteredRepasses.length !== 1 ? 's' : ''} encontrado{filteredRepasses.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${
              activeTab === 'convenio' 
                ? 'bg-gradient-to-r from-blue-50 to-blue-100' 
                : 'bg-gradient-to-r from-purple-50 to-purple-100'
            }`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-bold ${
                  activeTab === 'convenio' ? 'text-blue-800' : 'text-purple-800'
                }`}>Médico</th>
                {activeTab === 'convenio' && (
                  <th className="px-6 py-4 text-left text-sm font-bold text-blue-800">Convênio</th>
                )}
                {activeTab === 'particular' && (
                  <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Tipo</th>
                )}
                <th className={`px-6 py-4 text-left text-sm font-bold ${
                  activeTab === 'convenio' ? 'text-blue-800' : 'text-purple-800'
                }`}>Paciente</th>
                <th className={`px-6 py-4 text-left text-sm font-bold ${
                  activeTab === 'convenio' ? 'text-blue-800' : 'text-purple-800'
                }`}>Hospital</th>
                <th className={`px-6 py-4 text-left text-sm font-bold ${
                  activeTab === 'convenio' ? 'text-blue-800' : 'text-purple-800'
                }`}>Data Atendimento</th>
                <th className={`px-6 py-4 text-left text-sm font-bold ${
                  activeTab === 'convenio' ? 'text-blue-800' : 'text-purple-800'
                }`}>Valor</th>
                <th className={`px-6 py-4 text-left text-sm font-bold print:hidden ${
                  activeTab === 'convenio' ? 'text-blue-800' : 'text-purple-800'
                }`}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                        activeTab === 'convenio' ? 'border-blue-600' : 'border-purple-600'
                      }`}></div>
                      <span className="text-gray-500">Carregando dados...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRepasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <CreditCard className="h-12 w-12 text-gray-300" />
                      <span className="text-lg font-medium">Nenhum registro encontrado</span>
                      <span className="text-sm">Tente ajustar os filtros ou adicione novos registros</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRepasses.map((repasse) => (
                  <tr key={repasse.id} className={`transition-colors duration-150 ${
                    activeTab === 'convenio' ? 'hover:bg-blue-50' : 'hover:bg-purple-50'
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full print:hidden">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{repasse.medico?.nome}</div>
                          {repasse.medico?.crm && (
                            <div className="text-xs text-gray-500">CRM: {repasse.medico.crm}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {activeTab === 'convenio' && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-1.5 rounded-full print:hidden">
                            <Building size={14} className="text-green-600" />
                          </div>
                          <span className="font-medium text-gray-700">{repasse.convenio?.nome}</span>
                        </div>
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
                    )}
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{repasse.nome_paciente}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-1.5 rounded-full print:hidden">
                          <Building size={14} className="text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-700">{repasse.hospital?.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 print:hidden" />
                        <span className="font-medium text-gray-700">{new Date(repasse.data_cirurgia).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-green-100 px-3 py-1 rounded-full w-fit">
                        <span className="font-bold text-green-700 text-sm">R$ {repasse.valor.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(repasse)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 hover:scale-110"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(repasse.id)}
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
        {filteredRepasses.length > 0 && (
          <div className={`px-6 py-4 border-t border-gray-200 ${
            activeTab === 'convenio' 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100' 
              : 'bg-gradient-to-r from-purple-50 to-purple-100'
          }`}>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Exibindo {filteredRepasses.length} registro{filteredRepasses.length !== 1 ? 's' : ''}
                {selectedMedico && ` para ${medicos.find(m => m.id === parseInt(selectedMedico))?.nome}`}
              </div>
              <div className="text-lg font-bold text-gray-900">
                Total: R$ {totalGeral.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};