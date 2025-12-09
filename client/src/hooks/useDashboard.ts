import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Cobranca } from "@/types/cobranca";
import type { DashboardKPIs, ListarCobrancasResponse, Cliente } from "@/types/dashboard";

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
        cobrancasPagoMesAtual,
        cobrancasPagoMesAnterior,
        cobrancasPagoAnoAtual,
        cobrancasPagoAnoAnterior,
        cobrancasGeradasMes,
        cobrancasRecentes,
        clientesAtivos,
        clientesInativos,
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

      if (cobrancasPagoMesAtual.error) throw new Error(cobrancasPagoMesAtual.error.message);
      if (clientesAtivos.error) throw new Error(clientesAtivos.error.message);

      const parsedMesAtual = cobrancasPagoMesAtual.data as unknown as ListarCobrancasResponse;
      const parsedMesAnterior = cobrancasPagoMesAnterior.data as unknown as ListarCobrancasResponse;
      const parsedAnoAtual = cobrancasPagoAnoAtual.data as unknown as ListarCobrancasResponse;
      const parsedAnoAnterior = cobrancasPagoAnoAnterior.data as unknown as ListarCobrancasResponse;
      const parsedGeradas = cobrancasGeradasMes.data as unknown as ListarCobrancasResponse;
      const parsedRecentes = cobrancasRecentes.data as unknown as ListarCobrancasResponse;
      
      const listaClientesAtivos = clientesAtivos.data as unknown as Cliente[] || [];
      const listaClientesInativos = clientesInativos.data as unknown as Cliente[] || [];

      const faturamentoMesAtual = parsedMesAtual?.data?.cobrancas?.reduce(
        (sum, c) => sum + (Number(c.valor_total) || 0), 0
      ) || 0;
      
      const faturamentoMesAnterior = parsedMesAnterior?.data?.cobrancas?.reduce(
        (sum, c) => sum + (Number(c.valor_total) || 0), 0
      ) || 0;
      
      const faturamentoAnoAtual = parsedAnoAtual?.data?.cobrancas?.reduce(
        (sum, c) => sum + (Number(c.valor_total) || 0), 0
      ) || 0;
      
      const faturamentoAnoAnterior = parsedAnoAnterior?.data?.cobrancas?.reduce(
        (sum, c) => sum + (Number(c.valor_total) || 0), 0
      ) || 0;

      setKpis({
        faturamentoMensal: faturamentoMesAtual,
        faturamentoAnual: faturamentoAnoAtual,
        clientesAtivos: listaClientesAtivos.length,
        clientesInativos: listaClientesInativos.length,
        cobrancasGeradasMes: parsedGeradas?.data?.total || 0,
        tendenciaMensal: calcularTendencia(faturamentoMesAtual, faturamentoMesAnterior),
        tendenciaAnual: calcularTendencia(faturamentoAnoAtual, faturamentoAnoAnterior),
      });

      const cobrancasData = parsedRecentes?.data?.cobrancas || [];
      setCobrancasRecentes(cobrancasData as unknown as Cobranca[]);

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
