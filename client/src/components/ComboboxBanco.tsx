import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Loader2, Building2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InstituicaoFinanceira, ListarInstituicoesResponse } from '@/types/recebedor';

interface ComboboxBancoProps {
  value: string;
  displayName?: string;
  onChange: (instituicaoId: string, nomeFantasia: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ComboboxBanco({
  value,
  displayName = '',
  onChange,
  disabled = false,
  placeholder = 'Digite o nome do banco...',
}: ComboboxBancoProps) {
  const [instituicoes, setInstituicoes] = useState<InstituicaoFinanceira[]>([]);
  const [loading, setLoading] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (displayName && !busca) {
      setBusca(displayName);
    }
  }, [displayName]);

  const buscarInstituicoes = useCallback(async (termo: string) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('listar_instituicoes_financeiras', {
        p_busca: termo || null,
        p_limit: 20,
      });

      if (!error) {
        const response = data as ListarInstituicoesResponse;
        if (response.status === 'OK' && response.data?.instituicoes) {
          setInstituicoes(response.data.instituicoes);
        } else {
          setInstituicoes([]);
        }
      } else {
        console.error('Erro ao buscar instituições:', error);
        setInstituicoes([]);
      }
    } catch (err) {
      console.error('Erro ao buscar instituições:', err);
      setInstituicoes([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!aberto) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      buscarInstituicoes(busca);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [busca, aberto, buscarInstituicoes]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [instituicoes]);

  const handleSelecionar = (inst: InstituicaoFinanceira) => {
    const nome = inst.nome_fantasia || inst.nome;
    onChange(inst.id, nome);
    setBusca(nome);
    setAberto(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const termo = e.target.value;
    setBusca(termo);
  };

  const handleFocus = () => {
    setAberto(true);
    buscarInstituicoes(busca);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setAberto(false);
      if (value && displayName) {
        setBusca(displayName);
      } else if (!value) {
        setBusca('');
      }
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!aberto || instituicoes.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < instituicoes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < instituicoes.length) {
          handleSelecionar(instituicoes[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setAberto(false);
        break;
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={busca}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pl-9 pr-8"
          data-testid="input-banco-busca"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {aberto && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          data-testid="dropdown-bancos"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando bancos...
            </div>
          ) : instituicoes.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              {busca ? 'Nenhum banco encontrado' : 'Digite para buscar...'}
            </div>
          ) : (
            instituicoes.map((inst, index) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => handleSelecionar(inst)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover-elevate',
                  highlightedIndex === index && 'bg-accent',
                  value === inst.id && 'font-medium'
                )}
                data-testid={`option-banco-${inst.id}`}
              >
                <Check
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    value === inst.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{inst.nome_fantasia || inst.nome}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
