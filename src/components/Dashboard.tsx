
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { AccountsList } from './AccountsList';
import { CreditCardsList } from './CreditCardsList';
import { TransactionsList } from './TransactionsList';
import { CategoriesChart } from './CategoriesChart';
import { MonthlyChart } from './MonthlyChart';
import { DateRangeFilter } from './DateRangeFilter';
import OrganizzeAPI from '@/services/organizze';
import { DemoOrganizzeAPI } from '@/services/demoData';
import { OrganizzeCredentials, Account, Category, CreditCard, Transaction } from '@/types/organizze';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw, 
  LogOut,
  BarChart,
  PieChart,
  Calendar,
  Wallet
} from 'lucide-react';

interface DashboardProps {
  credentials: OrganizzeCredentials;
  api: OrganizzeAPI | DemoOrganizzeAPI;
  onLogout: () => void;
  isDemoMode?: boolean;
}

export function Dashboard({ credentials, api, onLogout, isDemoMode = false }: DashboardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Date range state - initialize with current month
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  console.log('Dashboard renderizando com novos recursos implementados');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('Carregando dados com novos recursos:', { startDateStr, endDateStr });

      const [accountsData, categoriesData, creditCardsData, transactionsData] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
        api.getCreditCards(),
        api.getTransactions({ startDate: startDateStr, endDate: endDateStr })
      ]);

      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setCreditCards(Array.isArray(creditCardsData) ? creditCardsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);

      toast({
        title: "Dados carregados com sucesso!",
        description: "Todas as funcionalidades foram implementadas e estão disponíveis.",
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Filter transactions to only include those from active accounts/cards in the period
  const getFilteredTransactions = () => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    
    return safeTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      // Check if transaction is within date range
      if (transactionDate < startDate || transactionDate > endDate) {
        return false;
      }
      
      // Check if account/card was active when transaction occurred
      if (transaction.account_id) {
        const account = accounts.find(a => a.id === transaction.account_id);
        if (account?.archived) {
          const archivedDate = new Date(account.updated_at);
          if (transactionDate >= archivedDate) return false;
        }
      }
      
      if (transaction.credit_card_id) {
        const card = creditCards.find(c => c.id === transaction.credit_card_id);
        if (card?.archived) {
          const archivedDate = new Date(card.updated_at);
          if (transactionDate >= archivedDate) return false;
        }
      }
      
      return true;
    });
  };

  // Calculate financial summary
  const filteredTransactions = getFilteredTransactions();
  
  const totalRevenues = filteredTransactions
    .filter(t => t && t.amount_cents > 0)
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t && t.amount_cents < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);

  const balance = totalRevenues - totalExpenses;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg shadow-lg">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Organizze Insight Hub {isDemoMode && (
                    <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md ml-2">
                      MODO DEMO - NOVOS RECURSOS IMPLEMENTADOS
                    </span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isDemoMode ? 'Dados simulados - Recursos: Saldos, Faturas, Período, Categorias' : `Conectado como: ${credentials.email}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando recursos implementados...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date Range Filter - NOVO RECURSO */}
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={handleDateRangeChange}
            />

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FinancialSummaryCard
                title="Receitas"
                value={totalRevenues}
                icon={TrendingUp}
                type="revenue"
              />
              <FinancialSummaryCard
                title="Despesas"
                value={totalExpenses}
                icon={TrendingDown}
                type="expense"
              />
              <FinancialSummaryCard
                title="Saldo"
                value={balance}
                icon={DollarSign}
                type="balance"
              />
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-muted/50">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart className="w-4 h-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="accounts" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Contas
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Movimentações
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Mensal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AccountsList 
                    accounts={accounts} 
                    selectedPeriod={{ startDate, endDate }}
                  />
                  <CreditCardsList 
                    creditCards={creditCards} 
                    selectedPeriod={{ startDate, endDate }}
                  />
                </div>
                <MonthlyChart transactions={filteredTransactions} />
              </TabsContent>

              <TabsContent value="accounts" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AccountsList 
                    accounts={accounts} 
                    selectedPeriod={{ startDate, endDate }}
                  />
                  <CreditCardsList 
                    creditCards={creditCards} 
                    selectedPeriod={{ startDate, endDate }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="transactions">
                <TransactionsList 
                  transactions={filteredTransactions}
                  categories={categories}
                  accounts={accounts}
                />
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <CategoriesChart 
                    transactions={filteredTransactions}
                    categories={categories}
                    type="expenses"
                  />
                  <CategoriesChart 
                    transactions={filteredTransactions}
                    categories={categories}
                    type="revenues"
                  />
                </div>
              </TabsContent>

              <TabsContent value="monthly">
                <MonthlyChart transactions={filteredTransactions} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
