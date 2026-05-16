package com.mercafacil.config;

import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.model.Role;
import com.mercafacil.model.User;
import com.mercafacil.repository.StoreRepository;
import com.mercafacil.repository.UserRepository;

@Component
public class StoreVendedorInitializer {

    private static final String DEFAULT_PASSWORD = "password123";

    private static final List<String[]> NOMBRES = List.of(
            new String[] { "Carlos", "García López" },
            new String[] { "Javier", "Martínez Ruiz" },
            new String[] { "Miguel", "López Sánchez" },
            new String[] { "Alejandro", "Sánchez Gómez" },
            new String[] { "David", "Fernández Díaz" },
            new String[] { "Daniel", "González Moreno" },
            new String[] { "Sergio", "Pérez Alonso" },
            new String[] { "Pablo", "Rodríguez Jiménez" },
            new String[] { "Adrián", "Jiménez Torres" },
            new String[] { "Rubén", "Torres Hernández" });

    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public StoreVendedorInitializer(StoreRepository storeRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void assignVendors() {
        List<com.mercafacil.model.Store> sinVendedor = storeRepository.findByVendedorIsNull();
        for (int i = 0; i < sinVendedor.size(); i++) {
            var store = sinVendedor.get(i);
            String email = "vendedor." + store.getId() + "@mercafacil.com";
            User vendedor;
            if (userRepository.existsByEmail(email)) {
                vendedor = userRepository.findByEmail(email).orElseThrow();
            } else {
                String[] nombre = NOMBRES.get(i % NOMBRES.size());
                var u = new User();
                u.setNombre(nombre[0]);
                u.setApellidos(nombre[1]);
                u.setEmail(email);
                u.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
                u.setRol(Role.VENDEDOR);
                vendedor = userRepository.save(u);
            }
            store.setVendedor(vendedor);
            storeRepository.save(store);
        }
    }
}
