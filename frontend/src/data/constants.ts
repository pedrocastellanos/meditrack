export const CATEGORIAS = [
  'Analgésicos', 'Antibióticos', 'Antiinflamatorios', 'Antialérgicos',
  'Antihipertensivos', 'Antidiabéticos', 'Gastrointestinales', 'Dermatológicos',
  'Vitaminas y suplementos', 'Anticonceptivos', 'Oftalmológicos', 'Respiratorios', 'Otros'
] as const

export const PRESENTACIONES = [
  'Tabletas', 'Cápsulas', 'Jarabe', 'Suspensión', 'Gotas', 'Crema',
  'Pomada', 'Inyectable', 'Supositorio', 'Solución', 'Parche', 'Polvo'
] as const

export const MOTIVOS_ENTRADA = [
  'Compra a proveedor', 'Devolución de cliente', 'Ajuste de inventario'
] as const

export const MOTIVOS_SALIDA = [
  'Venta', 'Producto vencido', 'Producto dañado', 'Devolución a proveedor', 'Ajuste de inventario'
] as const

export const ESTADOS_STOCK = ['normal', 'bajo', 'agotado'] as const
export const ESTADOS_VENCIMIENTO = ['vigente', 'próximo a vencer', 'vencido'] as const
