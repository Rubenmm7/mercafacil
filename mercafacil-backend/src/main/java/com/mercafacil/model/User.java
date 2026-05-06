package com.mercafacil.model;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role rol;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol.name()));
    }

    @Override public String getPassword()               { return password; }
    @Override public String getUsername()               { return email; }
    @Override public boolean isAccountNonExpired()      { return true; }
    @Override public boolean isAccountNonLocked()       { return true; }
    @Override public boolean isCredentialsNonExpired()  { return true; }
    @Override public boolean isEnabled()                { return true; }

    public Long getId()                            { return id; }
    public String getNombre()                      { return nombre; }
    public void   setNombre(String nombre)         { this.nombre = nombre; }
    public String getApellidos()                   { return apellidos; }
    public void   setApellidos(String apellidos)   { this.apellidos = apellidos; }
    public String getEmail()                       { return email; }
    public void   setEmail(String email)           { this.email = email; }
    public void   setPassword(String password)     { this.password = password; }
    public Role   getRol()                         { return rol; }
    public void   setRol(Role rol)                 { this.rol = rol; }
}
