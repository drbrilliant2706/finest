
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Phone, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  order_id: string | null;
  sonicpesa_order_id: string | null;
  reference: string | null;
  amount: number;
  currency: string;
  buyer_phone: string;
  buyer_name: string | null;
  status: string;
  result: string | null;
  profit: number;
  created_at: string;
}

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalProfit = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.profit || 0), 0);
  const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const successCount = transactions.filter(t => t.status === 'completed').length;
  const failedCount = transactions.filter(t => t.status === 'failed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading transactions...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transactions & Revenue</h2>
        <p className="text-muted-foreground">SonicPesa mobile money transactions and profit tracking</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">TSh {totalRevenue.toLocaleString()}</div>
                <p className="text-sm font-medium text-green-700">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">TSh {totalProfit.toLocaleString()}</div>
                <p className="text-sm font-medium text-blue-700">Total Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div>
              <div className="text-2xl font-bold text-yellow-900">TSh {pendingAmount.toLocaleString()}</div>
              <p className="text-sm font-medium text-yellow-700">Pending Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span className="font-bold">{successCount}</span>
                <span className="text-xs">success</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <ArrowDownRight className="h-4 w-4" />
                <span className="font-bold">{failedCount}</span>
                <span className="text-xs">failed</span>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-2">Transaction Summary</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{tx.buyer_name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {tx.buyer_phone}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      TSh {tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {tx.profit > 0 ? `TSh ${tx.profit.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tx.reference || '—'}</TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionManagement;
