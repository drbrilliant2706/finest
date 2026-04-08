
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Minus, Plus, CreditCard, Smartphone } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
  };
  selectedSize: string;
  selectedColor: string;
}

const ProductActions = ({ product, selectedSize, selectedColor }: ProductActionsProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { addToFavorites, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You must be logged in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSize) {
      toast({
        title: "Please select a size",
        description: "Size selection is required before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: selectedSize,
        color: selectedColor,
      });
    }

    toast({
      title: "Added to cart!",
      description: `${quantity}x ${product.name} has been added to your cart.`,
    });
  };

  const handleAddToFavorites = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You must be logged in to add items to favorites.",
        variant: "destructive",
      });
      return;
    }

    addToFavorites({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });

    toast({
      title: "Added to favorites!",
      description: `${product.name} has been added to your favorites.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Quantity</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-border rounded-md">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-muted transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 border-l border-r border-border">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleAddToCart}
          className="w-full bg-brand-green hover:bg-brand-green/90 text-primary-foreground font-bold py-4 transition-all duration-300 transform hover:scale-105"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          ADD TO CART - {product.price}
        </Button>

        <Button
          onClick={handleAddToFavorites}
          variant="outline"
          className={`w-full border-2 py-4 transition-all duration-300 transform hover:scale-105 ${
            isFavorite(product.id)
              ? 'border-brand-green text-brand-green bg-brand-green/10'
              : 'border-border text-muted-foreground hover:border-brand-green'
          }`}
          size="lg"
        >
          <Heart className={`mr-2 h-5 w-5 ${isFavorite(product.id) ? 'fill-brand-green' : ''}`} />
          {isFavorite(product.id) ? 'ADDED TO FAVORITES' : 'ADD TO FAVORITES'}
        </Button>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Payment Methods</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Smartphone className="h-5 w-5" />
            <span>M-Pesa</span>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Smartphone className="h-5 w-5" />
            <span>Airtel Money</span>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <CreditCard className="h-5 w-5" />
            <span>Credit Card</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductActions;
