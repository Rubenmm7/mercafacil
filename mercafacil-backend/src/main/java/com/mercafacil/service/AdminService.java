package com.mercafacil.service;

import com.mercafacil.dto.AdminStatsDto;
import com.mercafacil.dto.CreateUserRequest;
import com.mercafacil.dto.UpdateUserRequest;
import com.mercafacil.dto.UserDto;
import com.mercafacil.model.Role;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import com.mercafacil.repository.StoreRepository;
import com.mercafacil.repository.UserRepository;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository,
                        StoreRepository storeRepository,
                        OrderRepository orderRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AdminStatsDto getStats() {
        List<User> users = userRepository.findAll();
        return new AdminStatsDto(
                users.size(),
                storeRepository.count(),
                orderRepository.count(),
                countByRole(users, Role.CLIENTE),
                countByRole(users, Role.VENDEDOR),
                countByRole(users, Role.REPARTIDOR),
                countByRole(users, Role.PROVEEDOR),
                countByRole(users, Role.ADMIN)
        );
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public UserDto createUser(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Ya existe un usuario con el email: " + req.email());
        }
        User user = new User();
        user.setNombre(req.nombre());
        user.setApellidos(req.apellidos());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRol(req.rol());
        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto updateUser(Long userId, UpdateUserRequest req) {
        Long safeId = requireId(userId, "userId");
        User user = userRepository.findById(safeId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));
        user.setNombre(req.nombre());
        user.setApellidos(req.apellidos());
        user.setEmail(req.email());
        user.setRol(req.rol());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.password()));
        }
        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto changeRole(Long userId, Role newRole) {
        Long safeUserId = requireId(userId, "userId");
        User user = userRepository.findById(safeUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));
        user.setRol(newRole);
        return toDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        Long safeUserId = requireId(userId, "userId");
        User user = userRepository.findById(safeUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));
        userRepository.delete(requireUser(user));
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getNombre(), u.getApellidos(), u.getEmail(), u.getRol());
    }

    private long countByRole(List<User> users, Role role) {
        return users.stream().filter(u -> u.getRol() == role).count();
    }

    private @NonNull Long requireId(Long id, String fieldName) {
        return Objects.requireNonNull(id, fieldName + " no puede ser null");
    }

    private @NonNull User requireUser(User user) {
        return Objects.requireNonNull(user, "Usuario no encontrado");
    }
}
