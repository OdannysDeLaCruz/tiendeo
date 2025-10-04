/**
 * Formatea un precio a formato de moneda colombiana
 * @param price - Precio a formatear (puede ser number o string)
 * @param decimals - Número de decimales (default: 0)
 * @returns String con el precio formateado
 */
export function formatPrice(price: number | string, decimals: number = 0): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return '$0';
  }

  return `$${numPrice.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
