package com.mercafacil.data;

import com.mercafacil.model.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class MockDataLoader {

    private final List<Store> stores = new ArrayList<>();
    private final List<Product> products = new ArrayList<>();
    private final List<Category> categories = new ArrayList<>();
    private final List<DeliveryZone> deliveryZones = new ArrayList<>();

    public MockDataLoader() {
        loadStores();
        loadProducts();
        loadCategories();
        loadDeliveryZones();
    }

    private void loadStores() {
        stores.add(new Store(1, "Mercadona", "M", "#005A8B", "#E8F4FB", "Calle Gran Vía, 45", "Madrid", "912 345 678", "09:00 - 21:30", 4.5, "2-4h", 20, 1.99, "Supermercado"));
        stores.add(new Store(2, "Carrefour", "C", "#003087", "#E8EBF5", "Av. de la Constitución, 12", "Madrid", "913 456 789", "08:30 - 22:00", 4.2, "3-5h", 25, 2.49, "Hipermercado"));
        stores.add(new Store(3, "Lidl", "L", "#0050AA", "#E8F0FB", "Calle Serrano, 89", "Madrid", "914 567 890", "09:00 - 21:00", 4.3, "2-3h", 15, 1.49, "Supermercado"));
        stores.add(new Store(4, "Dia", "D", "#E31D1A", "#FBEAEA", "Calle Alcalá, 200", "Madrid", "915 678 901", "09:30 - 21:00", 3.9, "1-3h", 10, 0.99, "Supermercado"));
        stores.add(new Store(5, "Alcampo", "A", "#F47920", "#FEF3E8", "Parque Comercial Sur, Local 1", "Madrid", "916 789 012", "08:00 - 22:30", 4.1, "3-6h", 30, 3.99, "Hipermercado"));
        stores.add(new Store(6, "El Corte Inglés", "ECI", "#005F3B", "#E8F4EE", "Paseo de la Castellana, 79", "Madrid", "917 890 123", "10:00 - 21:00", 4.6, "4-8h", 40, 4.99, "Gran Almacén"));
    }

    private void loadProducts() {
        products.add(new Product(1, "Leche entera", "Lácteos",
            "https://granjamurrieta.com/wp-content/uploads/Granja-Murrieta-Leche-entera-2.jpg",
            "Leche entera pasteurizada de vaca, 1 litro", "1L",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 0.72, null, true, "Hacendado"),
                new StoreOffer(2, "Carrefour", 0.85, 0.95, true, "Carrefour Bio"),
                new StoreOffer(3, "Lidl", 0.69, null, true, "Milbona"),
                new StoreOffer(4, "Dia", 0.75, null, false, "Dia"),
                new StoreOffer(5, "Alcampo", 0.79, null, true, "Auchan")
            )));

        products.add(new Product(2, "Manzana Royal Gala", "Frutas",
            "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80",
            "Manzanas Royal Gala frescas de temporada", "1 kg",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 1.35, null, true, "Mercadona"),
                new StoreOffer(2, "Carrefour", 1.49, 1.89, true, "Carrefour"),
                new StoreOffer(3, "Lidl", 1.19, null, true, "Lidl"),
                new StoreOffer(5, "Alcampo", 1.25, null, true, "Alcampo"),
                new StoreOffer(6, "El Corte Inglés", 1.69, null, true, "Selección")
            )));

        products.add(new Product(3, "Pan de molde integral", "Panadería",
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80",
            "Pan de molde integral con semillas, 500g", "500g",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 1.15, null, true, "Hacendado"),
                new StoreOffer(2, "Carrefour", 1.29, null, true, "Carrefour"),
                new StoreOffer(3, "Lidl", 0.99, null, true, "Backfrei"),
                new StoreOffer(4, "Dia", 1.09, null, true, "Dia")
            )));

        products.add(new Product(4, "Yogur natural", "Lácteos",
            "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80",
            "Yogur natural cremoso sin azúcar añadido, pack 4 uds", "4 x 125g",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 0.89, null, true, "Hacendado"),
                new StoreOffer(2, "Carrefour", 1.05, 1.29, true, "Danone"),
                new StoreOffer(3, "Lidl", 0.79, null, true, "Milbona"),
                new StoreOffer(4, "Dia", 0.85, null, true, "Dia"),
                new StoreOffer(5, "Alcampo", 0.95, null, true, "Auchan"),
                new StoreOffer(6, "El Corte Inglés", 1.15, null, true, "Danone")
            )));

        products.add(new Product(5, "Pechuga de pollo", "Carnicería",
            "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80",
            "Pechuga de pollo fresca, fileteada y lista para cocinar", "500g",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 3.49, null, true, "Hacendado"),
                new StoreOffer(2, "Carrefour", 3.79, null, true, "Carrefour"),
                new StoreOffer(4, "Dia", 3.29, null, true, "Dia"),
                new StoreOffer(5, "Alcampo", 3.59, null, true, "Alcampo"),
                new StoreOffer(6, "El Corte Inglés", 4.25, null, true, "Selección")
            )));

        products.add(new Product(6, "Aceite de oliva virgen extra", "Aceites",
            "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80",
            "Aceite de oliva virgen extra, primera presión en frío", "750ml",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 4.99, null, true, "Hacendado"),
                new StoreOffer(2, "Carrefour", 5.49, 6.99, true, "Olitalia"),
                new StoreOffer(3, "Lidl", 4.49, null, true, "Belive"),
                new StoreOffer(5, "Alcampo", 4.79, null, true, "Auchan"),
                new StoreOffer(6, "El Corte Inglés", 6.25, null, true, "Castillo Canena")
            )));

        products.add(new Product(7, "Coca-Cola", "Bebidas",
            "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&q=80",
            "Refresco de cola, pack de 6 latas de 33cl", "6 x 33cl",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 3.29, null, true, "Coca-Cola"),
                new StoreOffer(2, "Carrefour", 3.49, 4.19, true, "Coca-Cola"),
                new StoreOffer(3, "Lidl", 3.19, null, true, "Coca-Cola"),
                new StoreOffer(4, "Dia", 3.39, null, true, "Coca-Cola"),
                new StoreOffer(5, "Alcampo", 2.99, null, true, "Coca-Cola")
            )));

        products.add(new Product(8, "Tomates cherry", "Verduras",
            "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&q=80",
            "Tomates cherry frescos de temporada", "500g",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 1.49, null, true, "Mercadona"),
                new StoreOffer(2, "Carrefour", 1.69, null, true, "Carrefour"),
                new StoreOffer(3, "Lidl", 1.29, null, true, "Lidl"),
                new StoreOffer(6, "El Corte Inglés", 1.95, null, true, "Selección")
            )));

        products.add(new Product(9, "Pasta espaguetis", "Pasta y arroz",
            "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&q=80",
            "Espaguetis de sémola de trigo duro, 500g", "500g",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 0.55, null, true, "Hacendado"),
                new StoreOffer(2, "Carrefour", 0.65, null, true, "Carrefour"),
                new StoreOffer(3, "Lidl", 0.49, null, true, "Combino"),
                new StoreOffer(4, "Dia", 0.59, null, true, "Dia"),
                new StoreOffer(5, "Alcampo", 0.62, null, true, "Auchan")
            )));

        products.add(new Product(10, "Zumo de naranja", "Bebidas",
            "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&q=80",
            "Zumo de naranja recién exprimido, 1 litro", "1L",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 1.89, null, true, "Hacendado"),
                new StoreOffer(2, "Carrefour", 2.15, 2.49, true, "Don Simón"),
                new StoreOffer(5, "Alcampo", 1.99, null, true, "Auchan"),
                new StoreOffer(6, "El Corte Inglés", 2.45, null, true, "Innocent")
            )));

        products.add(new Product(11, "Queso manchego", "Lácteos",
            "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&q=80",
            "Queso manchego semicurado D.O., cuña de 200g", "200g",
            Arrays.asList(
                new StoreOffer(1, "Mercadona", 2.99, null, true, "Hacendado"),
                new StoreOffer(2, "Carrefour", 3.49, 3.99, true, "García Baquero"),
                new StoreOffer(5, "Alcampo", 3.19, null, true, "Villarejo"),
                new StoreOffer(6, "El Corte Inglés", 3.95, null, true, "García Baquero")
            )));
    }

    private void loadCategories() {
        categories.add(new Category(1, "Frutas", "\uD83C\uDF4E", "#FF6B6B", "#FFF0F0", 45));
        categories.add(new Category(2, "Verduras", "\uD83E\uDD66", "#51CF66", "#F0FFF4", 52));
        categories.add(new Category(3, "Lácteos", "\uD83E\uDD5B", "#339AF0", "#F0F8FF", 38));
        categories.add(new Category(4, "Carnicería", "\uD83E\uDD69", "#FF922B", "#FFF3E8", 29));
        categories.add(new Category(5, "Panadería", "\uD83C\uDF5E", "#CC8500", "#FFF9E8", 24));
        categories.add(new Category(6, "Bebidas", "\uD83E\uDD64", "#845EF7", "#F5F0FF", 61));
        categories.add(new Category(7, "Congelados", "\uD83E\uDDCA", "#22B8CF", "#E8FBFF", 33));
        categories.add(new Category(8, "Limpieza", "\uD83E\uDDF9", "#F06595", "#FFF0F5", 47));
        categories.add(new Category(9, "Pasta y arroz", "\uD83C\uDF5D", "#FAB005", "#FFFBE8", 28));
        categories.add(new Category(10, "Aceites", "\uD83E\uDED9", "#94D82D", "#F8FFE8", 15));
    }

    private void loadDeliveryZones() {
        deliveryZones.add(new DeliveryZone("Zona Centro (Madrid)", 1.99, "1-2h", "2h", true));
        deliveryZones.add(new DeliveryZone("Zona Norte (Madrid)", 2.49, "2-3h", "3h", true));
        deliveryZones.add(new DeliveryZone("Zona Sur (Madrid)", 2.49, "2-3h", "3h", true));
        deliveryZones.add(new DeliveryZone("Zona Este (Madrid)", 2.99, "3-4h", "4h", true));
        deliveryZones.add(new DeliveryZone("Zona Oeste (Madrid)", 2.99, "3-4h", "4h", true));
        deliveryZones.add(new DeliveryZone("Municipios limítrofes", 4.99, "4-6h", "6h", true));
        deliveryZones.add(new DeliveryZone("Resto de España", 0, "", "", false));
    }

    public List<Store> getStores() { return stores; }
    public List<Product> getProducts() { return products; }
    public List<Category> getCategories() { return categories; }
    public List<DeliveryZone> getDeliveryZones() { return deliveryZones; }
}
