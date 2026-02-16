
import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductDetail from "@/components/product/ProductDetail";

interface DatabaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[] | null;
  brand: string | null;
  category: string | null;
  gender: string | null;
  stock_quantity: number | null;
}

interface ProductDetailType {
  id: string;
  name: string;
  price: string;
  image: string;
  badge: string;
  colors: string[];
  sizes: string[];
  description: string;
  features: string[];
}

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          setProduct(null);
          return;
        }

        if (data) {
          // Transform database product to ProductDetail format
          const transformedProduct: ProductDetailType = {
            id: data.id,
            name: data.name,
            price: `TSh ${data.price.toLocaleString()}`,
            image: data.images?.[0] || '/placeholder.svg',
            badge: data.stock_quantity && data.stock_quantity > 50 ? 'BESTSELLER' : 
                   data.stock_quantity && data.stock_quantity < 10 ? 'LIMITED' : 'NEW',
            colors: ["Red", "White", "Black"], // Default colors for now
            sizes: ["XS", "S", "M", "L", "XL", "XXL"], // Default sizes for now
            description: data.description || `Premium ${data.name} from ${data.brand || 'AFRIKA\'S FINEST'}. Made with high-quality materials and designed for comfort and style.`,
            features: [
              "Premium Cotton Material",
              "Comfortable Fit",
              "Machine Washable",
              "Ethically Made",
              "High-Quality Print",
              "Durable Construction"
            ]
          };
          setProduct(transformedProduct);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return <Navigate to="/404" replace />;
  }

  return <ProductDetail product={product} />;
};

export default Product;
