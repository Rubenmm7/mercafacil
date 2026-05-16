package com.mercafacil;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import com.mercafacil.config.CorsProperties;
import com.mercafacil.security.JwtProperties;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan(basePackageClasses = { CorsProperties.class, JwtProperties.class })
public class MercafacilApplication {

    public static void main(String[] args) {
        SpringApplication.run(MercafacilApplication.class, args);
    }

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("sim-gps-");
        return scheduler;
    }
}
