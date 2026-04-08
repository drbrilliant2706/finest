
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ProductImagesProps {
  product: {
    name: string;
    image: string;
    images?: string[];
    badge: string;
  };
}

const ProductImages = ({ product }: ProductImagesProps) => {
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];
  const [activeImage, setActiveImage] = useState(allImages[0]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg">
        <OptimizedImage
          src={activeImage}
          alt={product.name}
          className="w-full h-64 md:h-96 lg:h-[600px] object-cover hover:scale-105 transition-transform duration-300"
          lazy={false}
        />
        <Badge className="absolute top-4 left-4 bg-brand-green text-primary-foreground text-xs md:text-sm">
          {product.badge}
        </Badge>
      </div>
      
      {allImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto">
          {allImages.map((img, index) => (
            <OptimizedImage
              key={index}
              src={img}
              alt={`${product.name} ${index + 1}`}
              className={`w-16 h-16 md:w-20 md:h-20 object-cover rounded cursor-pointer border-2 transition-all hover:scale-105 flex-shrink-0 ${
                activeImage === img ? 'border-brand-green' : 'border-border'
              }`}
              onClick={() => setActiveImage(img)}
              lazy={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;
