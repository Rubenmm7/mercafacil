package com.mercafacil.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.mercafacil.model.Category;
import com.mercafacil.model.DeliveryZone;
import com.mercafacil.model.Product;
import com.mercafacil.model.Role;
import com.mercafacil.model.Store;
import com.mercafacil.model.StoreOffer;
import com.mercafacil.model.User;
import com.mercafacil.repository.CategoryRepository;
import com.mercafacil.repository.DeliveryZoneRepository;
import com.mercafacil.repository.ProductRepository;
import com.mercafacil.repository.StoreRepository;
import com.mercafacil.repository.UserRepository;

@Component
@SuppressWarnings("null")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final DeliveryZoneRepository deliveryZoneRepository;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           CategoryRepository categoryRepository,
                           StoreRepository storeRepository,
                           ProductRepository productRepository,
                           DeliveryZoneRepository deliveryZoneRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
        this.storeRepository = storeRepository;
        this.productRepository = productRepository;
        this.deliveryZoneRepository = deliveryZoneRepository;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedCategories();
        seedStores();
        seedProducts();
        seedDeliveryZones();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;
        userRepository.saveAll(List.of(
            user("Admin",  "Sistema",         "admin@mercafacil.com",      "admin123",      Role.ADMIN),
            user("Alba",   "García López",    "cliente@mercafacil.com",    "cliente123",    Role.CLIENTE),
            user("Carlos", "Martínez Ruiz",   "vendedor@mercafacil.com",   "vendedor123",   Role.VENDEDOR),
            user("Pedro",  "Sánchez Mora",    "repartidor@mercafacil.com", "repartidor123", Role.REPARTIDOR),
            user("Lucía",  "Fernández Gil",   "proveedor@mercafacil.com",  "proveedor123",  Role.PROVEEDOR)
        ));
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;
        categoryRepository.saveAll(List.of(
            category("Alimentación", "🥦", "#16a34a", "#dcfce7", 120),
            category("Electrónica",  "💻", "#2563eb", "#dbeafe",  45),
            category("Ropa & Hogar", "👕", "#9333ea", "#f3e8ff",  80),
            category("Limpieza",     "🧹", "#0891b2", "#cffafe",  60),
            category("Bebidas",      "🥤", "#dc2626", "#fee2e2",  35),
            category("Panadería",    "🍞", "#d97706", "#fef3c7",  28)
        ));
    }

    private void seedStores() {
        if (storeRepository.count() > 0) return;
        storeRepository.saveAll(List.of(
            store("FrutasVerde", "🌿", "#16a34a", "#dcfce7", "Pasillo A, Local 12", "Madrid", "91 123 45 67", "9:00-21:00",  4.8, "20-35 min", 15,  1.99, "Alimentación"),
            store("TechZone",   "💻", "#2563eb", "#dbeafe", "Pasillo B, Local 5",  "Madrid", "91 234 56 78", "10:00-20:00", 4.5, "30-50 min", 50,  2.99, "Electrónica"),
            store("MercaFresh", "🥩", "#dc2626", "#fee2e2", "Pasillo A, Local 3",  "Madrid", "91 345 67 89", "8:00-22:00",  4.9, "15-25 min", 10,  0.99, "Alimentación"),
            store("CleanHome",  "🧹", "#0891b2", "#cffafe", "Pasillo C, Local 8",  "Madrid", "91 456 78 90", "9:00-20:00",  4.3, "25-40 min", 20,  1.49, "Limpieza")
        ));
    }

    private void seedProducts() {
        if (productRepository.count() > 0) return;
        productRepository.saveAll(List.of(
            product("Manzanas Fuji",       "Alimentación", "🍎", "Manzanas dulces de origen español, calibre 70+",         "kg",
                offer(1L, "FrutasVerde",  1.99,   2.49, true,  "Huerta El Sol"),
                offer(3L, "MercaFresh",   2.19,   null, true,  "Frutas del Norte")),

            product("Plátanos de Canarias", "Alimentación", "🍌", "Plátanos IGP de Canarias, racimo aprox. 1kg",           "kg",
                offer(1L, "FrutasVerde",  1.49,   1.89, true,  "Plátanos Canarias"),
                offer(3L, "MercaFresh",   1.59,   null, true,  "Plátanos Canarias")),

            product("Leche Entera",        "Alimentación", "🥛", "Leche entera UHT, 1 litro",                              "1L",
                offer(3L, "MercaFresh",   0.99,   1.19, true,  "Pascual"),
                offer(1L, "FrutasVerde",  1.09,   null, true,  "Central Lechera")),

            product("Pan de Barra",        "Panadería",    "🍞", "Pan de barra artesano, horneado en el día",              "unidad",
                offer(3L, "MercaFresh",   0.89,   null, true,  "Panadería Local")),

            product("Detergente Ariel",    "Limpieza",     "🧺", "Detergente líquido Ariel, 30 lavados",                   "3L",
                offer(4L, "CleanHome",    8.99,  11.99, true,  "Ariel"),
                offer(3L, "MercaFresh",   9.49,   null, true,  "Ariel")),

            product("Jabón Fairy Limón",   "Limpieza",     "🍋", "Lavavajillas Fairy limón 780ml",                         "780ml",
                offer(4L, "CleanHome",    2.49,   2.99, true,  "Fairy")),

            product("Samsung TV 55\"",     "Electrónica",  "📺", "Smart TV Samsung QLED 55 pulgadas 4K",                  "unidad",
                offer(2L, "TechZone",   549.99, 699.99, true,  "Samsung")),

            product("Auriculares Sony",    "Electrónica",  "🎧", "Sony WH-1000XM5 con cancelación de ruido activa",        "unidad",
                offer(2L, "TechZone",   279.99, 349.99, true,  "Sony"))
        ));
    }

    private void seedDeliveryZones() {
        if (deliveryZoneRepository.count() > 0) return;
        deliveryZoneRepository.saveAll(List.of(
            zone("Centro", 2.50, "20 min", "30 min"),
            zone("Norte",  3.00, "30 min", "45 min"),
            zone("Sur",    2.00, "15 min", "25 min"),
            zone("Este",   3.50, "35 min", "50 min"),
            zone("Oeste",  2.75, "25 min", "35 min")
        ));
    }

    // --- helpers ---

    private User user(String nombre, String apellidos, String email, String password, Role rol) {
        User u = new User();
        u.setNombre(nombre);
        u.setApellidos(apellidos);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));
        u.setRol(rol);
        return u;
    }

    private Category category(String name, String icon, String color, String bgColor, int count) {
        Category c = new Category();
        c.setName(name);
        c.setIcon(icon);
        c.setColor(color);
        c.setBgColor(bgColor);
        c.setCount(count);
        return c;
    }

    private Store store(String name, String logo, String color, String bgColor, String address, String city,
                        String phone, String hours, double rating, String deliveryTime, int minOrder,
                        double deliveryFee, String category) {
        Store s = new Store();
        s.setName(name);
        s.setLogo(logo);
        s.setColor(color);
        s.setBgColor(bgColor);
        s.setAddress(address);
        s.setCity(city);
        s.setPhone(phone);
        s.setHours(hours);
        s.setRating(rating);
        s.setDeliveryTime(deliveryTime);
        s.setMinOrder(minOrder);
        s.setDeliveryFee(deliveryFee);
        s.setCategory(category);
        return s;
    }

    private Product product(String name, String category, String image, String description, String unit,
                            StoreOffer... offers) {
        Product p = new Product();
        p.setName(name);
        p.setCategory(category);
        p.setImage(image);
        p.setDescription(description);
        p.setUnit(unit);
        List<StoreOffer> list = new ArrayList<>(Arrays.asList(offers));
        list.forEach(o -> o.setProduct(p));
        p.setStoreOffers(list);
        return p;
    }

    private StoreOffer offer(Long storeId, String storeName, double price, Double originalPrice,
                             boolean inStock, String brand) {
        StoreOffer o = new StoreOffer();
        o.setStoreId(storeId);
        o.setStoreName(storeName);
        o.setPrice(price);
        o.setOriginalPrice(originalPrice);
        o.setInStock(inStock);
        o.setBrand(brand);
        return o;
    }

    private DeliveryZone zone(String name, double fee, String minTime, String maxTime) {
        DeliveryZone z = new DeliveryZone();
        z.setZone(name);
        z.setFee(fee);
        z.setMinTime(minTime);
        z.setMaxTime(maxTime);
        z.setAvailable(true);
        return z;
    }
}
