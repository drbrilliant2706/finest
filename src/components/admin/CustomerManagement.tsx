import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  Mail, 
  Phone, 
  DollarSign,
  ShoppingBag,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  customer_tier: string | null;
  created_at: string;
}

const getTierColor = (tier: string | null) => {
  switch (tier) {
    case 'Gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'Bronze': 
    default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  }
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => fetchCustomers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
        <p className="text-muted-foreground">
          Manage customer accounts and track order history
        </p>
      </div>

      {/* Customer Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/10">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  TSh {totalRevenue >= 1000000 
                    ? `${(totalRevenue / 1000000).toFixed(1)}M` 
                    : totalRevenue.toLocaleString()
                  }
                </div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  TSh {totalCustomers > 0 
                    ? Math.round(totalRevenue / totalCustomers).toLocaleString() 
                    : 0
                  }
                </div>
                <p className="text-sm text-muted-foreground">Avg. per Customer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {customer.first_name || customer.last_name 
                            ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                            : 'No name'
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Joined: {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{customer.total_orders || 0}</TableCell>
                    <TableCell className="font-medium">
                      TSh {(customer.total_spent || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(customer.customer_tier)} variant="secondary">
                        {customer.customer_tier || 'Bronze'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
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

export default CustomerManagement;
