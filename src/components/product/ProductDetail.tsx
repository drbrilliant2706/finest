
import { useState } from "react";
import ProductImages from "./ProductImages";
import ProductInfo from "./ProductInfo";
import ProductOptions from "./ProductOptions";
import ProductActions from "./ProductActions";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    badge: string;
    colors: string[];
    sizes: string[];
    description: string;
    features: string[];
  };
}

const ProductDetail = ({ product }: ProductDetailProps) => {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-muted py-4">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="text-sm">
            <a href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</a>
            <span className="mx-2 text-muted-foreground">/</span>
            <a href="/men" className="text-muted-foreground hover:text-primary transition-colors">Men</a>
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductImages product={product} />
          
          <div className="space-y-6">
            <ProductInfo product={product} />
            
            <ProductOptions
              colors={product.colors}
              sizes={product.sizes}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onColorChange={setSelectedColor}
              onSizeChange={setSelectedSize}
            />
            
            <ProductActions
              product={product}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
            />
          </div>
        </div>
      </div>
      <Footer variant="full" />
    </div>
  );
};

export default ProductDetail;
