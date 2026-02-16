
import { useState } from "react";
import ProductImages from "./ProductImages";
import ProductInfo from "./ProductInfo";
import ProductOptions from "./ProductOptions";
import ProductActions from "./ProductActions";

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
    <div className="min-h-screen bg-white">
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="text-sm">
            <a href="/" className="text-gray-500 hover:text-brand-green transition-colors">Home</a>
            <span className="mx-2 text-gray-500">/</span>
            <a href="/men" className="text-gray-500 hover:text-brand-green transition-colors">Men</a>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-black">{product.name}</span>
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
    </div>
  );
};

export default ProductDetail;
