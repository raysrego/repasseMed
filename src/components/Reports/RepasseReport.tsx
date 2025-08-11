import React, { useState, useEffect } from 'react';
import { CreditCard, User, Calendar, DollarSign, Building, Edit, Trash2, Plus, Filter, Stethoscope, Scissors, Printer } from 'lucide-react';
import { dbHelpers } from '../../lib/supabase';
import { Repasse, Medico, Convenio, Hospital } from '../../types';

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
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Relatório de Repasse ${activeTab === 'convenio' ? 'por Convênio' : 'Particular'}</h1>
                <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
              </div>
              ${printContent.innerHTML}
              <div class="total">
                <p>Total Geral: R$ ${totalGeral.toFixed(2)}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const filteredRepasses = repasses.filter(repasse => {
    const matchesTab = activeTab === 'convenio' ? !repasse.is_particular : repasse.is_particular;
    const matchesMedico = selectedMedico ? repasse.medico_id === parseInt(selectedMedico) : true;
    return matchesTab && matchesMedico;
  });

  const totalGeral = filteredRepasses.reduce((sum, item) => sum + item.valor, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            activeTab === 'convenio' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
              : 'bg-gradient-to-r from-purple-500 to-purple-600'
          }`}>
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Relatório de Repasse {activeTab === 'convenio' ? 'por Convênio' : 'Particular'}
            </h3>
            <p className="text-gray-600">Visualize e gerencie os repasses médicos</p>
          </div>
        </div>
        <button
          onClick={onNew}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
        >
          <Plus size={16} />
          Novo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtros:</span>
          </div>
          <div className="flex gap-4 flex-1">
            <div className="max-w-xs">
              <select
                value={selectedMedico}
                onChange={(e) => setSelectedMedico(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os médicos</option>
                {medicos.map(medico => (
                  <option key={medico.id} value={medico.id}>{medico.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Data início"
              />
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Data fim"
              />
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg"
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className={`p-6 rounded-xl border ${
        activeTab === 'convenio' 
          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' 
          : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeTab === 'convenio' ? 'bg-blue-500' : 'bg-purple-500'
            }`}>
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className={`text-lg font-semibold ${
                activeTab === 'convenio' ? 'text-blue-800' : 'text-purple-800'
              }`}>
                {selectedMedico 
                  ? `Total - ${medicos.find(m => m.id === parseInt(selectedMedico))?.nome}` 
                  : `Total ${activeTab === 'convenio' ? 'Convênio' : 'Particular'}`
                }
              </h4>
              <p className={`text-sm ${
                activeTab === 'convenio' ? 'text-blue-600' : 'text-purple-600'
              }`}>
                {filteredRepasses.length} repasses
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              activeTab === 'convenio' ? 'text-blue-700' : 'text-purple-700'
            }`}>
              R$ {totalGeral.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100" id="relatorio-repasse">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Registros de Repasse</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Médico</th>
                {activeTab === 'convenio' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Convênio</th>
                )}
                {activeTab === 'particular' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                )}
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hospital</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Data Atendimento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredRepasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredRepasses.map((repasse, index) => (
                  <tr key={repasse.id} className={`transition-colors duration-150 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full print:hidden">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{repasse.medico?.nome}</span>
                      </div>
                    </td>
                    {activeTab === 'convenio' && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-1.5 rounded-full print:hidden">
                            <Building size={14} className="text-green-600" />
                          </div>
                          <span className="text-gray-700">{repasse.convenio?.nome}</span>
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
                    <td className="px-6 py-4 text-gray-700">{repasse.nome_paciente}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-1.5 rounded-full print:hidden">
                          <Building size={14} className="text-purple-600" />
                        </div>
                        <span className="text-gray-700">{repasse.hospital?.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 print:hidden" />
                        <span className="text-gray-700">{new Date(repasse.data_cirurgia).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600 text-lg">R$ {repasse.valor.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(repasse)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(repasse.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
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
      </div>
    </div>
  );
};

            <select
              value={selectedMedico}
              onChange={(e) => setSelectedMedico(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os médicos</option>
              {medicos.map(medico => (
                <option key={medico.id} value={medico.id}>{medico.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className={`p-6 rounded-xl border ${
        activeTab === 'convenio' 
          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' 
          : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeTab === 'convenio' ? 'bg-blue-500' : 'bg-purple-500'
            }`}>
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className={`text-lg font-semibold ${
                activeTab === 'convenio' ? 'text-blue-800' : 'text-purple-800'
              }`}>
                {selectedMedico 
                  ? `Total - ${medicos.find(m => m.id === parseInt(selectedMedico))?.nome}` 
                  : `Total ${activeTab === 'convenio' ? 'Convênio' : 'Particular'}`
                }
              </h4>
              <p className={`text-sm ${
                activeTab === 'convenio' ? 'text-blue-600' : 'text-purple-600'
              }`}>
                {filteredRepasses.length} repasses
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              activeTab === 'convenio' ? 'text-blue-700' : 'text-purple-700'
            }`}>
              R$ {totalGeral.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Registros de Repasse</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Médico</th>
                {activeTab === 'convenio' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Convênio</th>
                )}
                {activeTab === 'particular' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                )}
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hospital</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Data Atendimento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredRepasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredRepasses.map((repasse, index) => (
                  <tr key={repasse.id} className={`transition-colors duration-150 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{repasse.medico?.nome}</span>
                      </div>
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
                          <Building size={14} className="text-purple-600" />
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(repasse)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(repasse.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
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
      </div>
    </div>
  );
};