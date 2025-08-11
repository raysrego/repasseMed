import React, { useState, useEffect } from 'react';
import { FileText, User, Calendar, DollarSign, Building, Edit, Trash2, Plus, Filter, Printer } from 'lucide-react';
import { dbHelpers } from '../../lib/supabase';
import { ProducaoMensal, Medico, Convenio } from '../../types';

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
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [selectedMedico, dataInicio, dataFim]);

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
    if (!selectedMedico && !dataInicio && !dataFim) {
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
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Relatório de Produção Mensal</h1>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Relatório de Produção Mensal</h3>
            <p className="text-gray-600">Visualize e gerencie a produção médica</p>
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
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-800">
                {selectedMedico ? `Total - ${medicos.find(m => m.id === parseInt(selectedMedico))?.nome}` : 'Total Geral'}
              </h4>
              <p className="text-sm text-green-600">{filteredProducoes.length} consultas</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-700">R$ {totalGeral.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100" id="relatorio-producao">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Registros de Produção</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Médico</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Convênio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Data Atendimento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredProducoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredProducoes.map((producao, index) => (
                  <tr key={producao.id} className={`transition-colors duration-150 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full print:hidden">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{producao.medico?.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-1.5 rounded-full print:hidden">
                          <Building size={14} className="text-green-600" />
                        </div>
                        <span className="text-gray-700">{producao.convenio?.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{producao.nome_paciente}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 print:hidden" />
                        <span className="text-gray-700">{new Date(producao.data_consulta).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-green-600 text-lg">R$ {producao.valor.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(producao)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(producao.id)}
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