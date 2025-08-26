import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CreateInvestmentInput } from '../../../server/src/schema';

interface InvestmentFormProps {
  onSubmit: (data: CreateInvestmentInput) => Promise<void>;
  isLoading?: boolean;
}

export function InvestmentForm({ onSubmit, isLoading = false }: InvestmentFormProps) {
  const [formData, setFormData] = useState<CreateInvestmentInput>({
    company_name: '',
    investment_date: new Date(),
    amount_invested: 0,
    funding_round: 'Pre-Seed',
    equity_percentage: 0,
    current_valuation: null,
    status: 'Active',
    notes: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      company_name: '',
      investment_date: new Date(),
      amount_invested: 0,
      funding_round: 'Pre-Seed',
      equity_percentage: 0,
      current_valuation: null,
      status: 'Active',
      notes: null
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvestmentInput) => ({ ...prev, company_name: e.target.value }))
            }
            placeholder="e.g., Acme Corp"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="investment_date">Investment Date *</Label>
          <Input
            id="investment_date"
            type="date"
            value={formatDateForInput(formData.investment_date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvestmentInput) => ({ 
                ...prev, 
                investment_date: new Date(e.target.value) 
              }))
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount_invested">Amount Invested ($) *</Label>
          <Input
            id="amount_invested"
            type="number"
            value={formData.amount_invested}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvestmentInput) => ({ 
                ...prev, 
                amount_invested: parseFloat(e.target.value) || 0 
              }))
            }
            placeholder="100000"
            step="1000"
            min="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Funding Round *</Label>
          <Select 
            value={formData.funding_round} 
            onValueChange={(value: any) =>
              setFormData((prev: CreateInvestmentInput) => ({ ...prev, funding_round: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select funding round" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
              <SelectItem value="Seed">Seed</SelectItem>
              <SelectItem value="Series A">Series A</SelectItem>
              <SelectItem value="Series B">Series B</SelectItem>
              <SelectItem value="Series C">Series C</SelectItem>
              <SelectItem value="Series D">Series D</SelectItem>
              <SelectItem value="Later Stage">Later Stage</SelectItem>
              <SelectItem value="Bridge">Bridge</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="equity_percentage">Equity Percentage (%) *</Label>
          <Input
            id="equity_percentage"
            type="number"
            value={formData.equity_percentage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvestmentInput) => ({ 
                ...prev, 
                equity_percentage: parseFloat(e.target.value) || 0 
              }))
            }
            placeholder="5.0"
            step="0.1"
            min="0"
            max="100"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_valuation">Current Valuation ($)</Label>
          <Input
            id="current_valuation"
            type="number"
            value={formData.current_valuation || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvestmentInput) => ({ 
                ...prev, 
                current_valuation: e.target.value ? parseFloat(e.target.value) : null 
              }))
            }
            placeholder="Optional - leave blank if unknown"
            step="1000"
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Investment Status *</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value: any) =>
            setFormData((prev: CreateInvestmentInput) => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Exited">Exited</SelectItem>
            <SelectItem value="Written Off">Written Off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateInvestmentInput) => ({ 
              ...prev, 
              notes: e.target.value || null 
            }))
          }
          placeholder="Optional notes about this investment..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? 'Creating...' : 'Create Investment'}
        </Button>
      </div>
    </form>
  );
}