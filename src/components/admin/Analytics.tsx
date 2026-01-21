import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Download
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderStats {
  month: string;
  revenue: number;
  orders: number;
}

interface CategoryStats {
  name: string;
  value: number;
  color: string;
}

interface TopCustomer {
  id: string;
  name: string;
  orders: number;
  spent: number;
  tier: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#ff6b6b'];

const getCustomerBadgeColor = (tier: string) => {
  switch (tier) {
    case 'Gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'Bronze': 
    default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  }
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState<OrderStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch orders for revenue/orders over time
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, created_at, payment_status')
          .order('created_at', { ascending: true });

        // Fetch products for category breakdown
        const { data: products } = await supabase
          .from('products')
          .select('category, price, stock_quantity');

        // Fetch customers for top customers
        const { data: customers } = await supabase
          .from('customers')
          .select('id, first_name, last_name, total_orders, total_spent, customer_tier')
          .order('total_spent', { ascending: false })
          .limit(5);

        // Process order stats by month
        const monthlyStats: { [key: string]: { revenue: number; orders: number } } = {};
        let totalRevenue = 0;
        let paidOrders = 0;

        (orders || []).forEach(order => {
          const date = new Date(order.created_at);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          
          if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { revenue: 0, orders: 0 };
          }
          
          if (order.payment_status === 'paid') {
            monthlyStats[monthKey].revenue += order.total_amount;
            totalRevenue += order.total_amount;
            paidOrders++;
          }
          monthlyStats[monthKey].orders++;
        });

        const orderStatsArray = Object.entries(monthlyStats).map(([month, stats]) => ({
          month,
          revenue: stats.revenue,
          orders: stats.orders
        }));

        // Process category stats
        const categoryCount: { [key: string]: number } = {};
        (products || []).forEach(product => {
          const category = product.category || 'Uncategorized';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });

        const categoryStatsArray = Object.entries(categoryCount).map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }));

        // Process top customers
        const topCustomersArray = (customers || []).map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
          orders: c.total_orders || 0,
          spent: c.total_spent || 0,
          tier: c.customer_tier || 'Bronze'
        }));

        setOrderStats(orderStatsArray);
        setCategoryStats(categoryStatsArray);
        setTopCustomers(topCustomersArray);
        setMetrics({
          totalRevenue,
          totalOrders: orders?.length || 0,
          totalCustomers: customers?.length || 0,
          avgOrderValue: paidOrders > 0 ? Math.round(totalRevenue / paidOrders) : 0
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Insights into your store's performance
          </p>
        </div>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TSh {metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From paid orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TSh {metrics.avgOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per paid order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topCustomers.length}</div>
            <p className="text-xs text-muted-foreground">By spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Overview</TabsTrigger>
          <TabsTrigger value="products">Product Categories</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {orderStats.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No sales data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={orderStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`TSh ${Number(value).toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders per Month</CardTitle>
              </CardHeader>
              <CardContent>
                {orderStats.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No order data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={orderStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryStats.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No product data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Spending</CardTitle>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No customer data yet
                </div>
              ) : (
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium">TSh {customer.spent.toLocaleString()}</p>
                          <Badge className={getCustomerBadgeColor(customer.tier)} variant="secondary">
                            {customer.tier}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
