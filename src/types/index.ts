export interface Medico {
  id: number;
  nome: string;
  crm?: string;
  created_at?: string;
}

export interface Convenio {
  id: number;
  nome: string;
  created_at?: string;
}

export interface Hospital {
  id: number;
  nome: string;
  cidade?: string;
  created_at?: string;
}

export interface ProducaoMensal {
  id: number;
  medico_id: number;
  convenio_id: number;
  nome_paciente: string;
  data_consulta: string;
  valor: number;
  tipo: 'consulta' | 'cirurgia';
  created_at?: string;
  medico?: Medico;
  convenio?: Convenio;
}

export interface Repasse {
  id: number;
  medico_id: number;
  convenio_id?: number;
  nome_paciente: string;
  hospital_id: number;
  data_cirurgia: string;
  valor: number;
  tipo: 'consulta' | 'cirurgia';
  is_particular: boolean;
  created_at?: string;
  medico?: Medico;
  convenio?: Convenio;
  hospital?: Hospital;
}