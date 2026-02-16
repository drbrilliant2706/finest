import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProductsQuery } from "@/hooks/useProductsQuery";
import { ProductSkeleton } from "@/components/ui/ProductSkeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Men = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { toast } = useToast();
  const { products, loading } = useProductsQuery();

  // Filter products for men and active status
  const menProducts = products.filter(product => 
    product.gender === 'MEN' && product.status === 'active'
  ).map(product => ({
    id: product.id,
    name: product.name,
    price: `TSh ${product.price.toLocaleString()}`,
    image: product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg",
    badge: "NEW",
    colors: ["Red", "White", "Black"],
    category: product.category || "TOPS"
  }));

  const filteredProducts = menProducts.filter(product => {
    if (selectedCategory !== "ALL" && product.category !== selectedCategory) {
      return false;
    }
    return true;
  });

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

  const handleToggleFavorite = (product: any) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You must be logged in to add items to favorites.",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
      toast({
        title: "Removed from favorites",
        description: `${product.name} has been removed from your favorites.`,
      });
    } else {
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      });
      toast({
        title: "Added to favorites!",
        description: `${product.name} has been added to your favorites.`,
      });
    }
  };

  const categories = ["ALL", "SHIRTS", "PANTS", "SHOES", "ACCESSORIES"];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-64 md:h-96 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/01e49984-7597-4559-943f-8455b941c993.png')`,
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
            MEN'S <span className="text-brand-green">COLLECTION</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-200">
            Step into style with our curated collection for men
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-4 md:py-6 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="border-gray-400 text-black hover:bg-gray-200 w-full sm:w-auto"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              
              {/* Desktop Filter Options */}
              <div className="hidden md:flex space-x-4 text-sm">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category 
                      ? "text-brand-green border-b border-brand-green" 
                      : "text-gray-600 hover:text-black"}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-gray-600 text-sm">{filteredProducts.length} products</p>
          </div>

          {/* Mobile Filter Panel */}
          {isFilterOpen && (
            <div className="md:hidden mt-4 p-4 bg-white rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filter Products</h3>
                <X className="h-5 w-5 cursor-pointer" onClick={() => setIsFilterOpen(false)} />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Category</h4>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsFilterOpen(false);
                      }}
                      className={`p-2 text-sm rounded ${
                        selectedCategory === category
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <ProductSkeleton count={8} />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">No men's products are currently available. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {filteredProducts.map((product) => (
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
                    <Badge className="absolute top-3 left-3 bg-gray-100 text-gray-600 text-xs font-normal">
                      {product.badge}
                    </Badge>
                    <div className="absolute top-3 right-3">
                      <Heart 
                        className={`h-5 w-5 sm:h-6 sm:w-6 cursor-pointer transition-colors ${
                          isFavorite(product.id) ? 'text-black fill-black' : 'text-gray-400 hover:text-black'
                        }`}
                        onClick={() => handleToggleFavorite(product)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <Link to={`/product/${product.id}`}>
                        <h4 className="text-black font-medium text-sm sm:text-base hover:underline line-clamp-2">{product.name}</h4>
                      </Link>
                      <span className="text-gray-400 hover:text-black cursor-pointer ml-2">+</span>
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

export default Men;
