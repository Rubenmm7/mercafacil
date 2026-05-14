package com.mercafacil.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class DateTimeUtils {

    public static final ZoneId MADRID_ZONE = ZoneId.of("Europe/Madrid");

    private DateTimeUtils() {
    }

    public static LocalDateTime nowMadrid() {
        return LocalDateTime.now(MADRID_ZONE);
    }

    public static LocalDateTime startOfTodayMadrid() {
        return LocalDate.now(MADRID_ZONE).atStartOfDay();
    }

    public static String toApiString(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return value.atZone(MADRID_ZONE).toOffsetDateTime().toString();
    }
}
