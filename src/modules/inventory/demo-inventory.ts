// Demo stock for "La Casona": suppliers, ingredients, recipes and a week of stock movements.
// Prices are illustrative Santa Cruz wholesale prices.
import type { Ingredient, Recipes, StockMovement, Supplier } from "./inventory";

const bs = (n: number) => Math.round(n * 100);
const kg = (n: number) => Math.round(n * 1000);

export const SUPPLIERS: Supplier[] = [
  { id: "sup-mercado", name: "Mercado Los Pozos", phone: "+591 70011001" },
  { id: "sup-friar", name: "Frigorífico Santa Cruz", phone: "+591 70011002" },
  { id: "sup-cbn", name: "Distribuidora CBN", phone: "+591 70011003" },
  { id: "sup-pil", name: "PIL Andina", phone: "+591 70011004" },
  { id: "sup-licores", name: "Licores del Oriente", phone: "+591 70011005" },
];

export const INGREDIENTS: Ingredient[] = [
  { id: "ing-res", name: "Carne de res (lomo)", category: "carnes", unit: "kg", stockMilli: kg(4.2), parMilli: kg(5), unitCostMinor: bs(65), supplierId: "sup-friar" },
  { id: "ing-charque", name: "Charque", category: "carnes", unit: "kg", stockMilli: kg(3.1), parMilli: kg(2), unitCostMinor: bs(90), supplierId: "sup-friar" },
  { id: "ing-chorizo", name: "Chorizo", category: "carnes", unit: "kg", stockMilli: kg(2.6), parMilli: kg(2), unitCostMinor: bs(48), supplierId: "sup-friar" },
  { id: "ing-pollo", name: "Alitas de pollo", category: "carnes", unit: "kg", stockMilli: kg(1.4), parMilli: kg(4), unitCostMinor: bs(28), supplierId: "sup-friar" },
  { id: "ing-papa", name: "Papa", category: "verduras", unit: "kg", stockMilli: kg(22), parMilli: kg(10), unitCostMinor: bs(6), supplierId: "sup-mercado" },
  { id: "ing-arroz", name: "Arroz", category: "abarrotes", unit: "kg", stockMilli: kg(18), parMilli: kg(10), unitCostMinor: bs(9), supplierId: "sup-mercado" },
  { id: "ing-tomate", name: "Tomate", category: "verduras", unit: "kg", stockMilli: kg(2.5), parMilli: kg(4), unitCostMinor: bs(8), supplierId: "sup-mercado" },
  { id: "ing-locoto", name: "Locoto", category: "verduras", unit: "kg", stockMilli: kg(0.6), parMilli: kg(1), unitCostMinor: bs(20), supplierId: "sup-mercado" },
  { id: "ing-platano", name: "Plátano", category: "verduras", unit: "u", stockMilli: kg(40), parMilli: kg(20), unitCostMinor: bs(1), supplierId: "sup-mercado" },
  { id: "ing-limon", name: "Limón", category: "verduras", unit: "kg", stockMilli: kg(6), parMilli: kg(3), unitCostMinor: bs(10), supplierId: "sup-mercado" },
  { id: "ing-mani", name: "Maní", category: "abarrotes", unit: "kg", stockMilli: kg(3), parMilli: kg(2), unitCostMinor: bs(22), supplierId: "sup-mercado" },
  { id: "ing-harina", name: "Harina", category: "abarrotes", unit: "kg", stockMilli: kg(15), parMilli: kg(8), unitCostMinor: bs(7), supplierId: "sup-mercado" },
  { id: "ing-huevo", name: "Huevo", category: "lacteos", unit: "u", stockMilli: kg(90), parMilli: kg(60), unitCostMinor: bs(1), supplierId: "sup-mercado" },
  { id: "ing-queso", name: "Queso menonita", category: "lacteos", unit: "kg", stockMilli: kg(3.8), parMilli: kg(3), unitCostMinor: bs(42), supplierId: "sup-pil" },
  { id: "ing-pan", name: "Pan de hamburguesa", category: "abarrotes", unit: "u", stockMilli: kg(14), parMilli: kg(12), unitCostMinor: bs(1.5), supplierId: "sup-mercado" },
  { id: "ing-pacena", name: "Paceña 620 ml", category: "bebidas", unit: "u", stockMilli: kg(96), parMilli: kg(48), unitCostMinor: bs(11), supplierId: "sup-cbn" },
  { id: "ing-huari", name: "Huari 620 ml", category: "bebidas", unit: "u", stockMilli: kg(20), parMilli: kg(24), unitCostMinor: bs(12.5), supplierId: "sup-cbn" },
  { id: "ing-singani", name: "Singani Casa Real", category: "licores", unit: "l", stockMilli: kg(4.5), parMilli: kg(3), unitCostMinor: bs(85), supplierId: "sup-licores" },
  { id: "ing-ron", name: "Ron blanco", category: "licores", unit: "l", stockMilli: kg(2), parMilli: kg(2), unitCostMinor: bs(70), supplierId: "sup-licores" },
  { id: "ing-ginger", name: "Ginger ale", category: "bebidas", unit: "l", stockMilli: kg(12), parMilli: kg(8), unitCostMinor: bs(8), supplierId: "sup-cbn" },
  { id: "ing-maracuya", name: "Pulpa de maracuyá", category: "verduras", unit: "kg", stockMilli: kg(2.2), parMilli: kg(2), unitCostMinor: bs(25), supplierId: "sup-mercado" },
];

/** What one portion uses. Dishes without a recipe don't move stock ("sin receta"). */
export const RECIPES: Recipes = {
  saltena: [{ ingredientId: "ing-res", qtyMilli: 60 }, { ingredientId: "ing-harina", qtyMilli: 70 }, { ingredientId: "ing-papa", qtyMilli: 30 }, { ingredientId: "ing-huevo", qtyMilli: 250 }],
  cunape: [{ ingredientId: "ing-queso", qtyMilli: 120 }, { ingredientId: "ing-huevo", qtyMilli: 500 }],
  papas: [{ ingredientId: "ing-papa", qtyMilli: 350 }],
  alitas: [{ ingredientId: "ing-pollo", qtyMilli: 450 }, { ingredientId: "ing-limon", qtyMilli: 20 }],
  majadito: [{ ingredientId: "ing-charque", qtyMilli: 120 }, { ingredientId: "ing-arroz", qtyMilli: 180 }, { ingredientId: "ing-huevo", qtyMilli: 1000 }, { ingredientId: "ing-platano", qtyMilli: 1000 }],
  pique: [
    { ingredientId: "ing-res", qtyMilli: 220 }, { ingredientId: "ing-chorizo", qtyMilli: 80 }, { ingredientId: "ing-papa", qtyMilli: 300 },
    { ingredientId: "ing-locoto", qtyMilli: 30 }, { ingredientId: "ing-tomate", qtyMilli: 60 }, { ingredientId: "ing-huevo", qtyMilli: 1000 },
  ],
  silpancho: [{ ingredientId: "ing-res", qtyMilli: 150 }, { ingredientId: "ing-arroz", qtyMilli: 150 }, { ingredientId: "ing-papa", qtyMilli: 200 }, { ingredientId: "ing-huevo", qtyMilli: 1000 }, { ingredientId: "ing-tomate", qtyMilli: 50 }],
  "sopa-mani": [{ ingredientId: "ing-mani", qtyMilli: 60 }, { ingredientId: "ing-papa", qtyMilli: 120 }, { ingredientId: "ing-res", qtyMilli: 40 }],
  hamburguesa: [{ ingredientId: "ing-res", qtyMilli: 180 }, { ingredientId: "ing-pan", qtyMilli: 1000 }, { ingredientId: "ing-tomate", qtyMilli: 40 }, { ingredientId: "ing-papa", qtyMilli: 200 }],
  pacena: [{ ingredientId: "ing-pacena", qtyMilli: 1000 }],
  huari: [{ ingredientId: "ing-huari", qtyMilli: 1000 }],
  chuflay: [{ ingredientId: "ing-singani", qtyMilli: 60 }, { ingredientId: "ing-ginger", qtyMilli: 200 }, { ingredientId: "ing-limon", qtyMilli: 15 }],
  mojito: [{ ingredientId: "ing-ron", qtyMilli: 60 }, { ingredientId: "ing-limon", qtyMilli: 40 }],
  limonada: [{ ingredientId: "ing-limon", qtyMilli: 80 }],
  maracuya: [{ ingredientId: "ing-maracuya", qtyMilli: 120 }],
  cheesecake: [{ ingredientId: "ing-queso", qtyMilli: 80 }, { ingredientId: "ing-maracuya", qtyMilli: 40 }, { ingredientId: "ing-huevo", qtyMilli: 500 }],
};

/** A week of receipts and waste so the ledger and the waste log aren't empty. */
export function seedStockMovements(now: number): StockMovement[] {
  const day = (d: number, h: number) => {
    const t = new Date(now);
    return new Date(t.getFullYear(), t.getMonth(), t.getDate() - d, h, 15).getTime();
  };
  const ing = (id: string) => INGREDIENTS.find((i) => i.id === id)!;
  const receive = (id: string, d: number, qty: number): StockMovement => ({
    id: `sm-r-${id}-${d}`, ingredientId: id, kind: "receive", deltaMilli: qty, at: day(d, 9), by: "s-daniela",
    costMinor: Math.round((ing(id).unitCostMinor * qty) / 1000), reason: "Compra",
  });
  const waste = (id: string, d: number, qty: number, reason: string, by: string): StockMovement => ({
    id: `sm-w-${id}-${d}`, ingredientId: id, kind: "waste", deltaMilli: -qty, at: day(d, 22), by,
    costMinor: Math.round((ing(id).unitCostMinor * qty) / 1000), reason,
  });
  return [
    receive("ing-res", 6, kg(10)), receive("ing-papa", 6, kg(30)), receive("ing-pacena", 5, kg(96)), receive("ing-pollo", 4, kg(6)),
    receive("ing-singani", 3, kg(6)), receive("ing-tomate", 2, kg(5)), receive("ing-queso", 1, kg(4)),
    waste("ing-tomate", 5, kg(0.8), "Vencido", "s-rosa"),
    waste("ing-pollo", 3, kg(0.5), "Se quemó", "s-rosa"),
    waste("ing-pacena", 2, kg(2), "Botellas rotas", "s-jorge"),
    waste("ing-res", 1, kg(0.3), "Plato devuelto", "s-rosa"),
  ];
}
