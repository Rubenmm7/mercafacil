package com.mercafacil.config;

import java.util.TimeZone;

import jakarta.annotation.PostConstruct;

import org.springframework.context.annotation.Configuration;

import com.mercafacil.util.DateTimeUtils;

@Configuration
public class TimezoneConfig {

    @PostConstruct
    public void setDefaultTimezone() {
        TimeZone.setDefault(TimeZone.getTimeZone(DateTimeUtils.MADRID_ZONE));
    }
}
