import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Search, User, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProductsQuery } from "@/hooks/useProductsQuery";
import { ProductSkeleton } from "@/components/ui/ProductSkeleton";
import ProfileModal from "@/components/profile/ProfileModal";
import CartModal from "@/components/cart/CartModal";
import SearchModal from "@/components/search/SearchModal";
import { DropAnimation, DropAnimationGroup } from "@/components/animations/DropAnimation";
import { HeaderCarousel } from "@/components/ui/header-carousel";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { PrefetchLink } from "@/components/ui/prefetch-link";
import { batchPreloadImages } from "@/utils/performance";
import Footer from "@/components/layout/Footer";
import NewsletterPopup from "@/components/newsletter/NewsletterPopup";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { addToCart, getTotalItems } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { user } = useAuth();
  const { toast } = useToast();

  const { products, loading: productsLoading } = useProductsQuery({ limit: 4 });

  const featuredProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    price: `TSh ${product.price.toLocaleString()}`,
    image: product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg",
    badge: "NEW"
  }));

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

  // Preload critical images on mount
  useEffect(() => {
    if (featuredProducts.length === 0) return;
    const criticalImages = featuredProducts.slice(0, 2).map(p => ({
      src: p.image,
      priority: 'high' as const
    }));
    
    batchPreloadImages(criticalImages).catch(err => 
      console.error('Failed to preload images:', err)
    );
  }, [featuredProducts]);

  return (
    <div className="min-h-screen bg-white text-black">
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .marquee {
            animation: marquee 15s linear infinite;
          }
        `}
      </style>

      {/* Marquee Header */}
      <div className="bg-black text-white py-1.5 sm:py-2 overflow-hidden">
        <div className="marquee whitespace-nowrap text-xs sm:text-sm md:text-base px-2">
          🎉 Fashion at it's ultimate prime. Shop with us and become part of our vast family worldwide. Afrika's finest telling our African Story. 🎉
        </div>
      </div>

      {/* Navigation with drop animation */}
      <DropAnimation delay={200} dropHeight={30}>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div className="flex-shrink-0 flex items-center">
                <OptimizedImage
                  src="/lovable-uploads/05b02c6d-e604-4df1-b5f6-7267787edde7.png" 
                  alt="Afrika's Finest Logo - East African Streetwear Brand" 
                  className="h-8 w-auto sm:h-10 md:h-12 mr-2"
                  lazy={false}
                  priority="high"
                />
                <PrefetchLink to="/" className="text-sm sm:text-lg md:text-xl font-bold text-black hidden xs:block">
                  AFRICAN'S <span className="text-black">FINEST</span>
                </PrefetchLink>
              </div>

              <div className="hidden lg:block">
                <div className="ml-10 flex items-baseline space-x-6 xl:space-x-8">
                  <PrefetchLink to="/" className="text-black border-b-2 border-black pb-1 text-sm xl:text-base font-medium" aria-current="page">HOME</PrefetchLink>
                  <PrefetchLink to="/lookbook" className="text-black hover:text-gray-600 transition-colors text-sm xl:text-base">LOOKBOOK</PrefetchLink>
                  <PrefetchLink to="/about" className="text-black hover:text-gray-600 transition-colors text-sm xl:text-base">ABOUT</PrefetchLink>
                  <PrefetchLink to="/culture" className="text-black hover:text-gray-600 transition-colors text-sm xl:text-base">CULTURE</PrefetchLink>
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold">
                    <PrefetchLink to="/men">NEW DROP</PrefetchLink>
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 sm:space-x-4">
                <Search 
                  className="h-5 w-5 sm:h-5 sm:w-5 text-primary hover:text-primary/70 cursor-pointer transition-colors p-0.5 touch-manipulation"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search products"
                />
                <User 
                  className="h-5 w-5 sm:h-5 sm:w-5 text-primary hover:text-primary/70 cursor-pointer transition-colors p-0.5 touch-manipulation"
                  onClick={() => setIsProfileOpen(true)}
                  aria-label="User profile"
                />
                <PrefetchLink to="/favorites" aria-label="View favorites" className="touch-manipulation">
                  <Heart className="h-5 w-5 sm:h-5 sm:w-5 text-primary hover:text-primary/70 cursor-pointer transition-colors" />
                </PrefetchLink>
                <div className="relative touch-manipulation">
                  <ShoppingCart 
                    className="h-5 w-5 sm:h-5 sm:w-5 text-primary hover:text-primary/70 cursor-pointer transition-colors" 
                    onClick={() => setIsCartOpen(true)}
                    aria-label="Shopping cart"
                  />
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center text-[10px] sm:text-xs" aria-label={`${getTotalItems()} items in cart`}>
                    {getTotalItems()}
                  </span>
                </div>
                <Menu 
                  className="h-6 w-6 text-primary hover:text-primary/70 cursor-pointer transition-colors lg:hidden p-0.5 touch-manipulation" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                  aria-expanded={isMenuOpen}
                />
              </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="lg:hidden border-t border-gray-200 py-4 bg-white">
                <div className="flex flex-col space-y-1 px-2">
                  <PrefetchLink to="/" className="text-black py-3 px-2 font-medium rounded-lg hover:bg-gray-100 touch-manipulation">HOME</PrefetchLink>
                  <PrefetchLink to="/lookbook" className="text-black hover:text-gray-600 transition-colors py-3 px-2 rounded-lg hover:bg-gray-100 touch-manipulation">LOOKBOOK</PrefetchLink>
                  <PrefetchLink to="/about" className="text-black hover:text-gray-600 transition-colors py-3 px-2 rounded-lg hover:bg-gray-100 touch-manipulation">ABOUT</PrefetchLink>
                  <PrefetchLink to="/culture" className="text-black hover:text-gray-600 transition-colors py-3 px-2 rounded-lg hover:bg-gray-100 touch-manipulation">CULTURE</PrefetchLink>
                  <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold mx-2 my-2 h-12 touch-manipulation">
                    <PrefetchLink to="/men">NEW DROP</PrefetchLink>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </DropAnimation>

      {/* Hero Section with Carousel Background */}
      <DropAnimation delay={300} dropHeight={40}>
        <header className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-screen overflow-hidden">
          {/* Background Carousel */}
          <div className="absolute inset-0">
            <HeaderCarousel />
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          {/* Text Content Overlay */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center max-w-4xl mx-auto px-4">
              <DropAnimation delay={400} dropHeight={40}>
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-3 sm:mb-4 text-white leading-tight">
                  AFRICA'S <span className="text-white">FINEST</span>
                </h1>
              </DropAnimation>
              <DropAnimation delay={500} dropHeight={30}>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white mb-6 sm:mb-8 px-4">
                  Authentic streetwear celebrating East African culture
                </p>
              </DropAnimation>
            </div>
          </div>
        </header>
      </DropAnimation>

      {/* Featured Products with staggered animations */}
      <main>
        <section className="py-6 sm:py-8 md:py-16 bg-white" aria-labelledby="featured-products">
          <div className="max-w-7xl mx-auto px-4">
            <DropAnimation delay={600} dropHeight={40}>
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <h2 id="featured-products" className="text-xl sm:text-2xl md:text-4xl font-bold text-black mb-2 sm:mb-4">
                  FEATURED <span className="text-black">PRODUCTS</span>
                </h2>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Discover our most popular items</p>
              </div>
            </DropAnimation>

          {productsLoading ? (
            <ProductSkeleton count={4} />
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {featuredProducts.map((product, index) => (
              <DropAnimation key={product.id} delay={800 + index * 150} dropHeight={50}>
                <div className="group">
                  <div className="relative overflow-hidden bg-gray-50 mb-3">
                    <PrefetchLink to={`/product/${product.id}`}>
                      <OptimizedImage
                        src={product.image} 
                        alt={`${product.name} - African streetwear fashion`}
                        className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        lazy={index >= 2}
                        priority={index < 2 ? 'high' : 'low'}
                      />
                    </PrefetchLink>
                    <div className="absolute top-3 right-3">
                      <Heart 
                        className={`h-5 w-5 sm:h-6 sm:w-6 cursor-pointer transition-colors ${
                          isFavorite(product.id) ? 'text-primary fill-primary' : 'text-gray-400 hover:text-primary'
                        }`}
                        onClick={() => handleToggleFavorite(product)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <PrefetchLink to={`/product/${product.id}`}>
                        <h4 className="text-black font-medium text-sm sm:text-base hover:underline cursor-pointer line-clamp-2">{product.name}</h4>
                      </PrefetchLink>
                      <span className="text-gray-400 hover:text-black cursor-pointer ml-2" onClick={() => handleAddToCart(product)}>+</span>
                    </div>
                    <p className="text-black text-sm sm:text-base">{product.price}</p>
                  </div>
                </div>
              </DropAnimation>
            ))}
          </div>
          )}

          <DropAnimation delay={1400} dropHeight={30}>
            <div className="text-center mt-6 sm:mt-8 md:mt-12">
              <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold">
                <PrefetchLink to="/men">VIEW ALL PRODUCTS</PrefetchLink>
              </Button>
            </div>
          </DropAnimation>
        </div>
        </section>

      </main>

      <Footer variant="full" />

      {/* Modals */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Newsletter Popup */}
      <NewsletterPopup />
    </div>
  );
};

export default Index;
