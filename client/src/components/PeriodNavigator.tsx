import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Granularidade = "mes" | "trimestre" | "semestre" | "ano";

interface PeriodNavigatorProps {
  granularidade: Granularidade;
  onGranularidadeChange: (value: Granularidade) => void;
  periodoOffset: number;
  onPeriodoOffsetChange: (offset: number) => void;
}

const GRANULARIDADE_LABELS: Record<Granularidade, string> = {
  mes: "Mês",
  trimestre: "Trimestre",
  semestre: "Semestre",
  ano: "Ano",
};

function formatPeriodoLabel(granularidade: Granularidade, offset: number): string {
  const hoje = new Date();
  
  switch (granularidade) {
    case "mes": {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
      const mes = data.toLocaleDateString("pt-BR", { month: "long" });
      const ano = data.getFullYear();
      return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${ano}`;
    }
    case "trimestre": {
      const mesAtual = hoje.getMonth();
      const trimestreAtual = Math.floor(mesAtual / 3);
      const novoTrimestre = trimestreAtual + offset;
      const anosOffset = Math.floor(novoTrimestre / 4);
      const trimestreFinal = ((novoTrimestre % 4) + 4) % 4;
      const ano = hoje.getFullYear() + anosOffset;
      return `${trimestreFinal + 1}º Trimestre ${ano}`;
    }
    case "semestre": {
      const mesAtual = hoje.getMonth();
      const semestreAtual = Math.floor(mesAtual / 6);
      const novoSemestre = semestreAtual + offset;
      const anosOffset = Math.floor(novoSemestre / 2);
      const semestreFinal = ((novoSemestre % 2) + 2) % 2;
      const ano = hoje.getFullYear() + anosOffset;
      return `${semestreFinal + 1}º Semestre ${ano}`;
    }
    case "ano": {
      const ano = hoje.getFullYear() + offset;
      return `${ano}`;
    }
  }
}

export function calcularIntervalo(
  granularidade: Granularidade,
  offset: number
): { dataInicio: string; dataFim: string } {
  const hoje = new Date();
  let dataInicio: Date;
  let dataFim: Date;

  switch (granularidade) {
    case "mes": {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + offset + 1, 0);
      break;
    }
    case "trimestre": {
      const mesAtual = hoje.getMonth();
      const trimestreAtual = Math.floor(mesAtual / 3);
      const novoTrimestre = trimestreAtual + offset;
      const anosOffset = Math.floor(novoTrimestre / 4);
      const trimestreFinal = ((novoTrimestre % 4) + 4) % 4;
      const ano = hoje.getFullYear() + anosOffset;
      const mesInicio = trimestreFinal * 3;
      dataInicio = new Date(ano, mesInicio, 1);
      dataFim = new Date(ano, mesInicio + 3, 0);
      break;
    }
    case "semestre": {
      const mesAtual = hoje.getMonth();
      const semestreAtual = Math.floor(mesAtual / 6);
      const novoSemestre = semestreAtual + offset;
      const anosOffset = Math.floor(novoSemestre / 2);
      const semestreFinal = ((novoSemestre % 2) + 2) % 2;
      const ano = hoje.getFullYear() + anosOffset;
      const mesInicio = semestreFinal * 6;
      dataInicio = new Date(ano, mesInicio, 1);
      dataFim = new Date(ano, mesInicio + 6, 0);
      break;
    }
    case "ano": {
      const ano = hoje.getFullYear() + offset;
      dataInicio = new Date(ano, 0, 1);
      dataFim = new Date(ano, 11, 31);
      break;
    }
  }

  return {
    dataInicio: dataInicio.toISOString().split("T")[0],
    dataFim: dataFim.toISOString().split("T")[0],
  };
}

export function PeriodNavigator({
  granularidade,
  onGranularidadeChange,
  periodoOffset,
  onPeriodoOffsetChange,
}: PeriodNavigatorProps) {
  const periodoLabel = formatPeriodoLabel(granularidade, periodoOffset);

  const handleAnterior = () => {
    onPeriodoOffsetChange(periodoOffset - 1);
  };

  const handleProximo = () => {
    onPeriodoOffsetChange(periodoOffset + 1);
  };

  const handleHoje = () => {
    onPeriodoOffsetChange(0);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-muted rounded-md p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleAnterior}
          data-testid="button-periodo-anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <button
          onClick={handleHoje}
          className="px-3 py-1 text-sm font-medium min-w-[140px] text-center hover-elevate rounded"
          data-testid="button-periodo-atual"
        >
          {periodoLabel}
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleProximo}
          data-testid="button-periodo-proximo"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Select
        value={granularidade}
        onValueChange={(value) => onGranularidadeChange(value as Granularidade)}
      >
        <SelectTrigger className="w-[120px]" data-testid="select-granularidade">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mes" data-testid="option-mes">
            {GRANULARIDADE_LABELS.mes}
          </SelectItem>
          <SelectItem value="trimestre" data-testid="option-trimestre">
            {GRANULARIDADE_LABELS.trimestre}
          </SelectItem>
          <SelectItem value="semestre" data-testid="option-semestre">
            {GRANULARIDADE_LABELS.semestre}
          </SelectItem>
          <SelectItem value="ano" data-testid="option-ano">
            {GRANULARIDADE_LABELS.ano}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
