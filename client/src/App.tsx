import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building2, TrendingUp, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { InvestmentForm } from '@/components/InvestmentForm';
import { ExitDetailsForm } from '@/components/ExitDetailsForm';
import type { Investment, ExitDetails, CreateInvestmentInput, CreateExitDetailsInput } from '../../server/src/schema';

function App() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [exitDetails, setExitDetails] = useState<Record<number, ExitDetails>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedExitInvestment, setSelectedExitInvestment] = useState<Investment | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadInvestments = useCallback(async () => {
    try {
      const result = await trpc.getInvestments.query();
      setInvestments(result);
      
      // Load exit details for each investment
      const exitDetailsMap: Record<number, ExitDetails> = {};
      for (const investment of result) {
        try {
          const exitDetail = await trpc.getExitDetailsByInvestmentId.query({ investment_id: investment.id });
          if (exitDetail) {
            exitDetailsMap[investment.id] = exitDetail;
          }
        } catch (error) {
          // Exit details might not exist for this investment, which is fine
          console.log(`No exit details found for investment ${investment.id}`);
        }
      }
      setExitDetails(exitDetailsMap);
    } catch (error) {
      console.error('Failed to load investments:', error);
    }
  }, []);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  const handleCreateInvestment = async (data: CreateInvestmentInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createInvestment.mutate(data);
      setInvestments((prev: Investment[]) => [...prev, response]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create investment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExit = async (data: CreateExitDetailsInput) => {
    setIsLoading(true);
    try {
      const response = await trpc.createExitDetails.mutate(data);
      setExitDetails((prev: Record<number, ExitDetails>) => ({
        ...prev,
        [data.investment_id]: response
      }));
      
      // Update investment status to "Exited"
      await trpc.updateInvestment.mutate({
        id: data.investment_id,
        status: 'Exited'
      });
      
      // Refresh investments to get updated status
      loadInvestments();
      setSelectedExitInvestment(null);
    } catch (error) {
      console.error('Failed to create exit details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3" />Active</Badge>;
      case 'Exited':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200"><TrendingUp className="w-3 h-3" />Exited</Badge>;
      case 'Written Off':
        return <Badge variant="destructive"><XCircle className="w-3 h-3" />Written Off</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoundBadge = (round: string) => {
    const colors: Record<string, string> = {
      'Pre-Seed': 'bg-purple-100 text-purple-800 border-purple-200',
      'Seed': 'bg-orange-100 text-orange-800 border-orange-200',
      'Series A': 'bg-blue-100 text-blue-800 border-blue-200',
      'Series B': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Series C': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Series D': 'bg-teal-100 text-teal-800 border-teal-200',
      'Later Stage': 'bg-gray-100 text-gray-800 border-gray-200',
      'Bridge': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return <Badge variant="outline" className={colors[round] || 'bg-gray-100 text-gray-800 border-gray-200'}>{round}</Badge>;
  };

  // Calculate portfolio metrics
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => {
    const exitDetail = exitDetails[inv.id];
    if (exitDetail) {
      return sum + exitDetail.proceeds_received;
    }
    return sum + (inv.current_valuation || inv.amount_invested);
  }, 0);
  const totalRealized = Object.values(exitDetails).reduce((sum, exit) => sum + exit.proceeds_received, 0);
  const activeInvestments = investments.filter(inv => inv.status === 'Active');
  const exitedInvestments = investments.filter(inv => inv.status === 'Exited');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">VC Investment Tracker</h1>
              <p className="text-gray-600">Manage your portfolio investments and exits</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Investment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Investment
                </DialogTitle>
              </DialogHeader>
              <InvestmentForm onSubmit={handleCreateInvestment} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${totalInvested.toLocaleString()}</div>
              <p className="text-xs text-gray-500">{investments.length} investments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${totalCurrentValue.toLocaleString()}</div>
              <p className="text-xs text-green-600">
                {totalCurrentValue > totalInvested ? '+' : ''}
                {((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(1)}% return
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Active Investments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{activeInvestments.length}</div>
              <p className="text-xs text-gray-500">
                ${activeInvestments.reduce((sum, inv) => sum + inv.amount_invested, 0).toLocaleString()} invested
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Realized Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${totalRealized.toLocaleString()}</div>
              <p className="text-xs text-gray-500">{exitedInvestments.length} exits</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active">Active ({activeInvestments.length})</TabsTrigger>
            <TabsTrigger value="exited">Exited ({exitedInvestments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6">
              {investments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No investments yet</h3>
                    <p className="text-gray-500 text-center mb-4">Get started by adding your first investment to track your portfolio.</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Investment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                investments.map((investment: Investment) => {
                  const exitDetail = exitDetails[investment.id];
                  const currentValue = exitDetail ? exitDetail.proceeds_received : (investment.current_valuation || investment.amount_invested);
                  const multiple = currentValue / investment.amount_invested;
                  
                  return (
                    <Card key={investment.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">{investment.company_name}</CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(investment.status)}
                                {getRoundBadge(investment.funding_round)}
                              </div>
                            </div>
                          </div>
                          {investment.status === 'Active' && !exitDetail && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedExitInvestment(investment)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Record Exit
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Investment Date</p>
                            <p className="font-semibold">{investment.investment_date.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Amount Invested</p>
                            <p className="font-semibold">${investment.amount_invested.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Equity %</p>
                            <p className="font-semibold">{investment.equity_percentage}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Current Multiple</p>
                            <p className={`font-semibold ${multiple >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                              {multiple.toFixed(2)}x
                            </p>
                          </div>
                        </div>
                        
                        {exitDetail && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">Exit Details</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-blue-700">Exit Date</p>
                                <p className="font-semibold">{exitDetail.exit_date.toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-blue-700">Proceeds</p>
                                <p className="font-semibold">${exitDetail.proceeds_received.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-blue-700">Exit Multiple</p>
                                <p className="font-semibold">{exitDetail.exit_multiple.toFixed(2)}x</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {investment.notes && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500">Notes</p>
                            <p className="text-sm">{investment.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid gap-6">
              {activeInvestments.map((investment: Investment) => {
                const currentValue = investment.current_valuation || investment.amount_invested;
                const multiple = currentValue / investment.amount_invested;
                
                return (
                  <Card key={investment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{investment.company_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              {getRoundBadge(investment.funding_round)}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedExitInvestment(investment)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          Record Exit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Investment Date</p>
                          <p className="font-semibold">{investment.investment_date.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount Invested</p>
                          <p className="font-semibold">${investment.amount_invested.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Current Valuation</p>
                          <p className="font-semibold">
                            {investment.current_valuation ? `$${investment.current_valuation.toLocaleString()}` : 'TBD'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Paper Multiple</p>
                          <p className={`font-semibold ${multiple >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {multiple.toFixed(2)}x
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {activeInvestments.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No active investments</h3>
                    <p className="text-gray-500 text-center">All investments have been exited or written off.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="exited">
            <div className="grid gap-6">
              {exitedInvestments.map((investment: Investment) => {
                const exitDetail = exitDetails[investment.id];
                if (!exitDetail) return null;
                
                return (
                  <Card key={investment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{investment.company_name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            {getRoundBadge(investment.funding_round)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Investment Date</p>
                          <p className="font-semibold">{investment.investment_date.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Exit Date</p>
                          <p className="font-semibold">{exitDetail.exit_date.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount Invested</p>
                          <p className="font-semibold">${investment.amount_invested.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Proceeds Received</p>
                          <p className="font-semibold text-green-600">${exitDetail.proceeds_received.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-700 font-semibold">Exit Multiple</p>
                            <p className="text-2xl font-bold text-green-800">{exitDetail.exit_multiple.toFixed(2)}x</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-700 font-semibold">Net Gain/Loss</p>
                            <p className={`text-2xl font-bold ${exitDetail.proceeds_received >= investment.amount_invested ? 'text-green-800' : 'text-red-600'}`}>
                              ${(exitDetail.proceeds_received - investment.amount_invested).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {exitDetail.notes && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Exit Notes</p>
                          <p className="text-sm">{exitDetail.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {exitedInvestments.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No exits yet</h3>
                    <p className="text-gray-500 text-center">Record exits for your investments to track realized returns.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Exit Details Dialog */}
        <Dialog open={!!selectedExitInvestment} onOpenChange={() => setSelectedExitInvestment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Record Exit - {selectedExitInvestment?.company_name}
              </DialogTitle>
            </DialogHeader>
            {selectedExitInvestment && (
              <ExitDetailsForm 
                investment={selectedExitInvestment}
                onSubmit={handleCreateExit} 
                isLoading={isLoading} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;