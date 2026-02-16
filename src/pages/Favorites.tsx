import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Favorites = () => {
  const { favorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You must be logged in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });

    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleRemoveFromFavorites = (id: string) => {
    removeFromFavorites(id);
    toast({
      title: "Removed from favorites",
      description: "Item has been removed from your favorites.",
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">
            YOUR <span className="text-primary">FAVORITES</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            Items you've saved for later
          </p>
        </div>
      </section>

      {/* Favorites Grid */}
      <section className="py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h3>
              <p className="text-gray-500 mb-6">Start browsing and add items you love!</p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/men">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {favorites.map((product) => (
                <div key={product.id} className="group">
                  <div className="relative overflow-hidden bg-gray-50 mb-3">
                    <Link to={`/product/${product.id}`}>
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </Link>
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleRemoveFromFavorites(product.id)}
                        className="p-1.5 hover:bg-white/80 rounded-full transition-colors"
                      >
                        <Trash2 className="h-5 w-5 text-gray-600 hover:text-black" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <Link to={`/product/${product.id}`}>
                        <h4 className="text-black font-medium text-sm sm:text-base line-clamp-2 hover:underline">{product.name}</h4>
                      </Link>
                      <span 
                        className="text-gray-400 hover:text-black cursor-pointer ml-2"
                        onClick={() => handleAddToCart(product)}
                      >
                        +
                      </span>
                    </div>
                    <p className="text-black text-sm sm:text-base">{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Favorites;
