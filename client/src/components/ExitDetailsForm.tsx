import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import type { Investment, CreateExitDetailsInput } from '../../../server/src/schema';

interface ExitDetailsFormProps {
  investment: Investment;
  onSubmit: (data: CreateExitDetailsInput) => Promise<void>;
  isLoading?: boolean;
}

export function ExitDetailsForm({ investment, onSubmit, isLoading = false }: ExitDetailsFormProps) {
  const [formData, setFormData] = useState<CreateExitDetailsInput>({
    investment_id: investment.id,
    exit_date: new Date(),
    proceeds_received: 0,
    exit_multiple: 0,
    notes: null
  });

  // Calculate exit multiple automatically when proceeds change
  const calculateExitMultiple = (proceeds: number) => {
    return investment.amount_invested > 0 ? proceeds / investment.amount_invested : 0;
  };

  const handleProceedsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const proceeds = parseFloat(e.target.value) || 0;
    const exitMultiple = calculateExitMultiple(proceeds);
    setFormData((prev: CreateExitDetailsInput) => ({ 
      ...prev, 
      proceeds_received: proceeds,
      exit_multiple: exitMultiple
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const gainLoss = formData.proceeds_received - investment.amount_invested;
  const isPositive = gainLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Investment Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Investment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Company</p>
              <p className="font-semibold text-blue-900">{investment.company_name}</p>
            </div>
            <div>
              <p className="text-blue-700">Investment Date</p>
              <p className="font-semibold text-blue-900">{investment.investment_date.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-blue-700">Amount Invested</p>
              <p className="font-semibold text-blue-900">${investment.amount_invested.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-blue-700">Equity</p>
              <p className="font-semibold text-blue-900">{investment.equity_percentage}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exit Details Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exit_date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Exit Date *
            </Label>
            <Input
              id="exit_date"
              type="date"
              value={formatDateForInput(formData.exit_date)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateExitDetailsInput) => ({ 
                  ...prev, 
                  exit_date: new Date(e.target.value) 
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proceeds_received" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Proceeds Received ($) *
            </Label>
            <Input
              id="proceeds_received"
              type="number"
              value={formData.proceeds_received}
              onChange={handleProceedsChange}
              placeholder="0"
              step="1000"
              min="0"
              required
            />
          </div>
        </div>

        {/* Calculated Metrics */}
        {formData.proceeds_received > 0 && (
          <Card className={`${isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-lg flex items-center gap-2 ${isPositive ? 'text-green-900' : 'text-red-900'}`}>
                <TrendingUp className="w-5 h-5" />
                Exit Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className={`text-sm ${isPositive ? 'text-green-700' : 'text-red-700'}`}>Exit Multiple</p>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
                    {formData.exit_multiple.toFixed(2)}x
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isPositive ? 'text-green-700' : 'text-red-700'}`}>Net Gain/Loss</p>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
                    {isPositive ? '+' : ''}${gainLoss.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isPositive ? 'text-green-700' : 'text-red-700'}`}>Return %</p>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
                    {isPositive ? '+' : ''}{((gainLoss / investment.amount_invested) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Exit Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateExitDetailsInput) => ({ 
                ...prev, 
                notes: e.target.value || null 
              }))
            }
            placeholder="Optional notes about this exit (acquisition details, buyer, circumstances, etc.)..."
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? 'Recording Exit...' : 'Record Exit'}
          </Button>
        </div>
      </form>
    </div>
  );
}