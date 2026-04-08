
interface ProductOptionsProps {
  colors: string[];
  sizes: string[];
  selectedColor: string;
  selectedSize: string;
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
}

const ProductOptions = ({
  colors,
  sizes,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange
}: ProductOptionsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Color: {selectedColor}</h3>
        <div className="flex space-x-3">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`px-4 py-2 border rounded-md transition-all hover:scale-105 ${
                selectedColor === color
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-border text-muted-foreground hover:border-brand-green'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Size: {selectedSize}</h3>
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`py-3 border rounded-md transition-all hover:scale-105 ${
                selectedSize === size
                  ? 'border-brand-green bg-brand-green text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-brand-green'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductOptions;
