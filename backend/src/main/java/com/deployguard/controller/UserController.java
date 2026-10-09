package com.deployguard.controller;

import com.deployguard.dto.request.UpdateUserRolesRequest;
import com.deployguard.dto.response.ApiResponse;
import com.deployguard.dto.response.UserProfileResponse;
import com.deployguard.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Endpoints for managing and querying platform team members")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List all platform users for assignment")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        List<UserProfileResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable UUID id) {
        UserProfileResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user roles (Administrator only)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUserRoles(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRolesRequest request) {
        UserProfileResponse user = userService.updateUserRoles(id, request);
        return ResponseEntity.ok(ApiResponse.ok(user, "User roles updated successfully"));
    }
}
