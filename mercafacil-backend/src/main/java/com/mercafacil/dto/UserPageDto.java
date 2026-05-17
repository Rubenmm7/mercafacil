package com.mercafacil.dto;

import java.util.List;

public record UserPageDto(
        List<UserDto> content,
        long totalElements,
        int totalPages,
        int page,
        int size) {
}
