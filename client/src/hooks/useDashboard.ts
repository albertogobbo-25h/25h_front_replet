import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Cobranca } from "@/types/cobranca";
import type { DashboardKPIs, Cliente } from "@/types/dashboard";

interface CobrancaRPC {
  id: string;
  cliente_id: string;
  cliente_assinatura_id: string | null;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  status_pagamento: string;
  data_emissao: string;
  meio_pagamento: string | null;
  dthr_pagamento: string | null;
  link_pagamento: string;
  observacao: string | null;
  criado_em: string;
  cliente: {
    nome: string;
    nome_visualizacao: string;
    whatsapp: string;
    cpf_cnpj: string;
  };
  assinatura: { status: string } | null;
  plano: { nome: string; tipo: string; valor_mensal: number } | null;
}

interface ListarCobrancasEnvelope {
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  data: {
    cobrancas: CobrancaRPC[];
    total: number;
    limit: number;
    offset: number;
  };
}

function getMonthDateRange(date: Date = new Date()): { inicio: string; fim: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const inicio = new Date(year, month, 1).toISOString().split('T')[0];
  const fim = new Date(year, month + 1, 0).toISOString().split('T')[0];
  return { inicio, fim };
}

function getYearDateRange(year: number = new Date().getFullYear()): { inicio: string; fim: string } {
  return {
    inicio: `${year}-01-01`,
    fim: `${year}-12-31`
  };
}

function getPreviousMonthDateRange(): { inicio: string; fim: string } {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return getMonthDateRange(prevMonth);
}

function getPreviousYearDateRange(): { inicio: string; fim: string } {
  return getYearDateRange(new Date().getFullYear() - 1);
}

function calcularTendencia(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

function parseCobrancasEnvelope(data: unknown): ListarCobrancasEnvelope | null {
  if (!data || typeof data !== 'object') return null;
  const envelope = data as ListarCobrancasEnvelope;
  if (envelope.status !== 'OK') return null;
  return envelope;
}

function mapRPCToCobranca(rpc: CobrancaRPC): Cobranca {
  return {
    id: rpc.id,
    assinante_id: '',
    cliente_id: rpc.cliente_id,
    cliente_assinatura_id: rpc.cliente_assinatura_id,
    cliente_plano_id: null,
    descricao: rpc.descricao,
    valor_total: rpc.valor_total,
    data_vencimento: rpc.data_vencimento,
    status_pagamento: rpc.status_pagamento as Cobranca['status_pagamento'],
    data_emissao: rpc.data_emissao,
    link_pagamento: rpc.link_pagamento,
    meio_pagamento: rpc.meio_pagamento as Cobranca['meio_pagamento'],
    dthr_pagamento: rpc.dthr_pagamento,
    observacao: rpc.observacao,
    criado_em: rpc.criado_em,
    cliente: rpc.cliente ? {
      nome: rpc.cliente.nome,
      nome_visualizacao: rpc.cliente.nome_visualizacao,
      whatsapp: rpc.cliente.whatsapp,
      cpf_cnpj: rpc.cliente.cpf_cnpj,
    } : undefined,
    assinatura: rpc.assinatura ? { status: rpc.assinatura.status } : undefined,
    plano: rpc.plano ? {
      nome: rpc.plano.nome,
      tipo: rpc.plano.tipo,
      valor_mensal: rpc.plano.valor_mensal,
    } : undefined,
  };
}

export interface UseDashboardResult {
  kpis: DashboardKPIs;
  cobrancasRecentes: Cobranca[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs>({
    faturamentoMensal: 0,
    faturamentoAnual: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    cobrancasGeradasMes: 0,
    tendenciaMensal: null,
    tendenciaAnual: null,
  });
  const [cobrancasRecentes, setCobrancasRecentes] = useState<Cobranca[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const mesAtual = getMonthDateRange();
      const mesAnterior = getPreviousMonthDateRange();
      const anoAtual = getYearDateRange();
      const anoAnterior = getPreviousYearDateRange();

      const [
        resPagoMesAtual,
        resPagoMesAnterior,
        resPagoAnoAtual,
        resPagoAnoAnterior,
        resGeradasMes,
        resRecentes,
        resClientesAtivos,
        resClientesInativos,
      ] = await Promise.all([
        supabase.rpc('listar_cobrancas_cliente', {
          p_status_pagamento: 'PAGO',
          p_data_vencimento_inicio: mesAtual.inicio,
          p_data_vencimento_fim: mesAtual.fim,
          p_limit: 1000,
          p_offset: 0,
        }),
        supabase.rpc('listar_cobrancas_cliente', {
          p_status_pagamento: 'PAGO',
          p_data_vencimento_inicio: mesAnterior.inicio,
          p_data_vencimento_fim: mesAnterior.fim,
          p_limit: 1000,
          p_offset: 0,
        }),
        supabase.rpc('listar_cobrancas_cliente', {
          p_status_pagamento: 'PAGO',
          p_data_vencimento_inicio: anoAtual.inicio,
          p_data_vencimento_fim: anoAtual.fim,
          p_limit: 10000,
          p_offset: 0,
        }),
        supabase.rpc('listar_cobrancas_cliente', {
          p_status_pagamento: 'PAGO',
          p_data_vencimento_inicio: anoAnterior.inicio,
          p_data_vencimento_fim: anoAnterior.fim,
          p_limit: 10000,
          p_offset: 0,
        }),
        supabase.rpc('listar_cobrancas_cliente', {
          p_data_vencimento_inicio: mesAtual.inicio,
          p_data_vencimento_fim: mesAtual.fim,
          p_limit: 1,
          p_offset: 0,
        }),
        supabase.rpc('listar_cobrancas_cliente', {
          p_limit: 10,
          p_offset: 0,
        }),
        supabase.rpc('listar_clientes', {
          p_ind_ativo: true,
          p_limit: 10000,
          p_offset: 0,
        }),
        supabase.rpc('listar_clientes', {
          p_ind_ativo: false,
          p_limit: 10000,
          p_offset: 0,
        }),
      ]);

      const errors: string[] = [];
      if (resPagoMesAtual.error) errors.push(`Faturamento mensal: ${resPagoMesAtual.error.message}`);
      if (resPagoMesAnterior.error) errors.push(`Faturamento m\u00eas anterior: ${resPagoMesAnterior.error.message}`);
      if (resPagoAnoAtual.error) errors.push(`Faturamento anual: ${resPagoAnoAtual.error.message}`);
      if (resPagoAnoAnterior.error) errors.push(`Faturamento ano anterior: ${resPagoAnoAnterior.error.message}`);
      if (resGeradasMes.error) errors.push(`Cobran\u00e7as geradas: ${resGeradasMes.error.message}`);
      if (resRecentes.error) errors.push(`Cobran\u00e7as recentes: ${resRecentes.error.message}`);
      if (resClientesAtivos.error) errors.push(`Clientes ativos: ${resClientesAtivos.error.message}`);
      if (resClientesInativos.error) errors.push(`Clientes inativos: ${resClientesInativos.error.message}`);

      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }

      const envPagoMesAtual = parseCobrancasEnvelope(resPagoMesAtual.data);
      const envPagoMesAnterior = parseCobrancasEnvelope(resPagoMesAnterior.data);
      const envPagoAnoAtual = parseCobrancasEnvelope(resPagoAnoAtual.data);
      const envPagoAnoAnterior = parseCobrancasEnvelope(resPagoAnoAnterior.data);
      const envGeradasMes = parseCobrancasEnvelope(resGeradasMes.data);
      const envRecentes = parseCobrancasEnvelope(resRecentes.data);

      const listaClientesAtivos = (resClientesAtivos.data as Cliente[] | null) || [];
      const listaClientesInativos = (resClientesInativos.data as Cliente[] | null) || [];

      const faturamentoMesAtual = envPagoMesAtual?.data.cobrancas.reduce(
        (sum, c) => sum + (Number(c.valor_total) || 0), 0
      ) || 0;
      
      const faturamentoMesAnterior = envPagoMesAnterior?.data.cobrancas.reduce(
        (sum, c) => sum + (Number(c.valor_total) || 0), 0
      ) || 0;
      
      const faturamentoAnoAtual = envPagoAnoAtual?.data.cobrancas.reduce(
        (sum, c) => sum + (Number(c.valor_total) || 0), 0
      ) || 0;
      
      const faturamentoAnoAnterior = envPagoAnoAnterior?.data.cobrancas.reduce(
        (sum, c) => sum + (Number(c.valor_total) || 0), 0
      ) || 0;

      setKpis({
        faturamentoMensal: faturamentoMesAtual,
        faturamentoAnual: faturamentoAnoAtual,
        clientesAtivos: listaClientesAtivos.length,
        clientesInativos: listaClientesInativos.length,
        cobrancasGeradasMes: envGeradasMes?.data.total || 0,
        tendenciaMensal: calcularTendencia(faturamentoMesAtual, faturamentoMesAnterior),
        tendenciaAnual: calcularTendencia(faturamentoAnoAtual, faturamentoAnoAnterior),
      });

      const cobrancasRPC = envRecentes?.data.cobrancas || [];
      setCobrancasRecentes(cobrancasRPC.map(mapRPCToCobranca));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard';
      setError(errorMessage);
      console.error('Erro no dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    kpis,
    cobrancasRecentes,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
