
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  if (!isOpen) return null;

  const handleSubmitOrder = async () => {
    if (!customerName || !customerPhone) {
      toast.error('Please provide your name and phone number');
      return;
    }

    // Ensure phone is in 255 format
    let phone = customerPhone.replace(/\s+/g, '').replace(/^\+/, '');
    if (phone.startsWith('0')) {
      phone = '255' + phone.slice(1);
    }
    if (!phone.startsWith('255')) {
      toast.error('Please enter a valid Tanzanian phone number');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          first_name: customerName,
          phone: phone,
          email: customerEmail || `${phone}@guest.local`,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Calculate totals
      const subtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.price.replace(/[^\d.]/g, ''));
        return sum + (price * item.quantity);
      }, 0);

      // Create order
      const orderNumber = `ORD-${Date.now()}`;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customer.id,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'pending',
          subtotal,
          total_amount: subtotal,
          currency: 'TZS',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id.toString(),
        quantity: item.quantity,
        unit_price: parseFloat(item.price.replace(/[^\d.]/g, '')),
        total_price: parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Trigger USSD push payment via SonicPesa
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          buyer_email: customerEmail || undefined,
          buyer_name: customerName,
          buyer_phone: phone,
          amount: subtotal,
          currency: 'TZS',
          order_id: order.id,
          customer_id: customer.id,
        },
      });

      if (paymentError) throw paymentError;

      if (paymentData?.success) {
        setPaymentStatus('success');
        toast.success('USSD payment request sent to your phone! Please complete the payment on your device.');
        clearCart();
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setTimeout(() => {
          setPaymentStatus('idle');
          onClose();
        }, 4000);
      } else {
        setPaymentStatus('failed');
        toast.error('Payment request failed. Your order has been saved. Please try again.');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      setPaymentStatus('failed');
      toast.error('Failed to process order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-black">Shopping Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>

        {paymentStatus === 'processing' && (
          <div className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-green mx-auto mb-4" />
            <h3 className="text-lg font-bold text-black mb-2">Processing Payment...</h3>
            <p className="text-gray-600">A USSD prompt is being sent to your phone. Please check your device and complete the payment.</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Payment Request Sent!</h3>
            <p className="text-gray-600">Complete the USSD payment on your phone. Your order will be confirmed once payment is received.</p>
          </div>
        )}

        {paymentStatus === 'idle' && (
          <div className="p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Your cart is empty</p>
                <Button onClick={onClose} className="mt-4 bg-brand-green hover:bg-brand-green/90 text-white">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <Card key={item.id} className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                          <div className="flex-1">
                            <h4 className="text-black font-bold text-sm">{item.name}</h4>
                            <p className="text-brand-green font-bold">{item.price}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-black hover:text-brand-green">
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-black">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-black hover:text-brand-green">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-brand-green hover:text-brand-green-light">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-black font-bold">Total:</span>
                    <span className="text-brand-green font-bold text-lg">TSh {getTotalPrice()}</span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <Label htmlFor="name" className="text-black">Name *</Label>
                      <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your full name" className="border-gray-300" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-black">Phone Number * (for USSD payment)</Label>
                      <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0788 123 456" className="border-gray-300" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-black">Email (Optional)</Label>
                      <Input id="email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="your@email.com" className="border-gray-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button onClick={handleSubmitOrder} disabled={loading} className="w-full bg-brand-green hover:bg-brand-green/90 text-white">
                      {loading ? 'Processing...' : 'Pay via Mobile Money (USSD)'}
                    </Button>
                    <Button variant="outline" onClick={clearCart} className="w-full border-gray-300 text-black hover:bg-gray-100">
                      Clear Cart
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✕</span>
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Payment Failed</h3>
            <p className="text-gray-600 mb-4">Something went wrong. Your order has been saved.</p>
            <Button onClick={() => setPaymentStatus('idle')} className="bg-brand-green hover:bg-brand-green/90 text-white">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
