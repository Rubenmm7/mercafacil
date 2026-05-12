package com.mercafacil.config;

import com.mercafacil.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@SuppressWarnings("unused")
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // @Lazy evita una dependencia circular: SecurityConfig necesita JwtAuthFilter,
    // que necesita UserService, que a su vez puede necesitar beans de seguridad.
    public SecurityConfig(@Lazy JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        AuthenticationEntryPoint unauthorizedHandler = (req, res, ex) ->
                res.sendError(HttpStatus.UNAUTHORIZED.value(), "Unauthorized");

        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/products/**", "/api/stores/**",
                                "/api/categories/**", "/api/delivery-zones/**").permitAll()
                        .requestMatchers("/api/orders/**")
                                .hasAnyRole("CLIENTE", "VENDEDOR", "REPARTIDOR", "ADMIN")
                        .requestMatchers("/api/messages/**")
                                .hasAnyRole("CLIENTE", "VENDEDOR", "REPARTIDOR", "PROVEEDOR", "ADMIN")
                        .requestMatchers("/api/vendedor/**").hasRole("VENDEDOR")
                        .requestMatchers("/api/repartidor/**").hasRole("REPARTIDOR")
                        .requestMatchers("/api/proveedor/**").hasRole("PROVEEDOR")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/tracking/**")
                                .hasAnyRole("CLIENTE", "VENDEDOR", "REPARTIDOR", "ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
