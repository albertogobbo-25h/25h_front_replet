import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminAssinantes() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Gerenciar Assinantes
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie todos os assinantes do sistema
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CNPJ..."
                  className="pl-10"
                  data-testid="input-search-assinantes"
                />
              </div>
              <Button variant="outline" data-testid="button-filtros">
                Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p data-testid="text-empty-state">
                Funcionalidade em desenvolvimento. Em breve você poderá gerenciar todos os assinantes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
