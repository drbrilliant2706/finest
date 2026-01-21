import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  CheckCircle,
  Smartphone,
  Building
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentStats {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  pendingPayments: number;
}

const paymentMethods = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    type: 'mobile',
    status: 'active',
    fees: '1.5%',
    icon: <Smartphone className="h-5 w-5" />
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    type: 'mobile',
    status: 'active',
    fees: '1.2%',
    icon: <Smartphone className="h-5 w-5" />
  },
  {
    id: 'visa',
    name: 'Visa/Mastercard',
    type: 'card',
    status: 'active',
    fees: '2.9%',
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    type: 'bank',
    status: 'inactive',
    fees: '0.5%',
    icon: <Building className="h-5 w-5" />
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const PaymentSettings = () => {
  const [activeTab, setActiveTab] = useState('methods');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats>({
    totalOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    const fetchPaymentStats = async () => {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, payment_status');

        if (orders) {
          const paidOrders = orders.filter(o => o.payment_status === 'paid');
          const pendingOrders = orders.filter(o => o.payment_status === 'pending');
          
          setStats({
            totalOrders: orders.length,
            paidOrders: paidOrders.length,
            totalRevenue: paidOrders.reduce((sum, o) => sum + o.total_amount, 0),
            pendingPayments: pendingOrders.reduce((sum, o) => sum + o.total_amount, 0)
          });
        }
      } catch (error) {
        console.error('Error fetching payment stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStats();
  }, []);

  const successRate = stats.totalOrders > 0 
    ? ((stats.paidOrders / stats.totalOrders) * 100).toFixed(1) 
    : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payment Settings</h2>
        <p className="text-muted-foreground">
          Configure payment methods and view payment statistics
        </p>
      </div>

      {/* Payment Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.paidOrders}</div>
                <p className="text-sm text-muted-foreground">Paid Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  TSh {stats.totalRevenue >= 1000000 
                    ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` 
                    : stats.totalRevenue.toLocaleString()
                  }
                </div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{successRate}%</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  TSh {stats.pendingPayments.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {method.icon}
                      </div>
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-muted-foreground">Processing fee: {method.fees}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(method.status)} variant="secondary">
                        {method.status}
                      </Badge>
                      <Switch defaultChecked={method.status === 'active'} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input id="currency" value="TSh (Tanzanian Shilling)" readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Payment Timeout (minutes)</Label>
                  <Input id="timeout" type="number" defaultValue="15" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-capture payments</p>
                  <p className="text-sm text-muted-foreground">Automatically capture authorized payments</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Refund notifications</p>
                  <p className="text-sm text-muted-foreground">Send email notifications for refunds</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">3D Secure</p>
                  <p className="text-sm text-muted-foreground">Enable 3D Secure for card payments</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Fraud detection</p>
                  <p className="text-sm text-muted-foreground">Automatically flag suspicious transactions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">PCI DSS compliance</p>
                  <p className="text-sm text-muted-foreground">Maintain PCI DSS compliance standards</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSettings;
