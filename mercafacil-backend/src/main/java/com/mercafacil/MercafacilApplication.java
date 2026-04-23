package com.mercafacil;

import com.mercafacil.config.CorsProperties;
import com.mercafacil.security.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan(basePackageClasses = {CorsProperties.class, JwtProperties.class})
public class MercafacilApplication {
    public static void main(String[] args) {
        SpringApplication.run(MercafacilApplication.class, args);
    }
}
