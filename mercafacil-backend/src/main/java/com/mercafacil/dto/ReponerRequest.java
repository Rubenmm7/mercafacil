package com.mercafacil.dto;

import java.util.List;

public record ReponerRequest(Long storeId, List<ReponerItemRequest> items) {}
