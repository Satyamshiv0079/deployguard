package com.deployguard.controller;

import com.deployguard.dto.request.LoginRequest;
import com.deployguard.dto.request.RegisterRequest;
import com.deployguard.dto.request.UpdateUserRolesRequest;
import com.deployguard.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private String getBearerToken(String username, String password) throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username(username)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("token").asText();
    }

    @Test
    @DisplayName("Should successfully authenticate seeded admin user and return JWT bearer token")
    void shouldLoginSuccessfully() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("admin")
                .password("Admin@123456")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.username").value("admin"))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("Should reject invalid password with 401 Unauthorized")
    void shouldRejectInvalidCredentials() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("admin")
                .password("WrongPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid username or password."));
    }

    @Test
    @DisplayName("Should register new user and strictly assign ROLE_DEVELOPER")
    void shouldRegisterNewUser() throws Exception {
        String uniqueUser = "analyst_" + System.currentTimeMillis();
        RegisterRequest registerRequest = RegisterRequest.builder()
                .username(uniqueUser)
                .email(uniqueUser + "@deployguard.internal")
                .password("SecurePassword@2026")
                .fullName("Compliance Analyst")
                .department("Financial Crime Risk")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value(uniqueUser))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_DEVELOPER")))
                .andExpect(jsonPath("$.data.roles", hasSize(1)));
    }

    @Test
    @DisplayName("Should prevent privilege escalation by ignoring client-supplied roles in registration payload")
    void shouldPreventPrivilegeEscalationOnPublicRegistration() throws Exception {
        String maliciousUser = "attacker_" + System.currentTimeMillis();
        // Client attempts to escalate privileges by injecting ADMIN, REVIEWER, and PROJECT_MANAGER roles
        String maliciousPayload = "{\n" +
                "  \"username\": \"" + maliciousUser + "\",\n" +
                "  \"email\": \"" + maliciousUser + "@deployguard.internal\",\n" +
                "  \"password\": \"SecurePass123!\",\n" +
                "  \"fullName\": \"Privilege Escalation Attempt\",\n" +
                "  \"roles\": [\"ROLE_ADMIN\", \"ROLE_REVIEWER\", \"ROLE_PROJECT_MANAGER\"]\n" +
                "}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_DEVELOPER")))
                .andExpect(jsonPath("$.data.roles", not(hasItem("ROLE_ADMIN"))))
                .andExpect(jsonPath("$.data.roles", not(hasItem("ROLE_REVIEWER"))))
                .andExpect(jsonPath("$.data.roles", not(hasItem("ROLE_PROJECT_MANAGER"))));
    }

    @Test
    @DisplayName("Should restrict administrative role assignment endpoint to ADMIN users")
    void shouldRestrictRoleAssignmentToAdmin() throws Exception {
        UUID alexId = userRepository.findByUsername("dev_alex").orElseThrow().getId();
        UpdateUserRolesRequest updateRequest = UpdateUserRolesRequest.builder()
                .roles(Set.of("ROLE_REVIEWER"))
                .build();

        // 1. Unauthenticated attempt -> 401 Unauthorized
        mockMvc.perform(put("/api/users/" + alexId + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isUnauthorized());

        // 2. Non-admin attempt (dev_alex) -> 403 Forbidden
        String alexToken = getBearerToken("dev_alex", "Password@123");
        mockMvc.perform(put("/api/users/" + alexId + "/roles")
                        .header("Authorization", "Bearer " + alexToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());

        // 3. Admin attempt -> 200 OK
        String adminToken = getBearerToken("admin", "Admin@123456");
        mockMvc.perform(put("/api/users/" + alexId + "/roles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_REVIEWER")));
    }

    @Test
    @DisplayName("Should enforce input validation and return 400 Bad Request with field errors")
    void shouldValidateInputFields() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .username("ab") // min 3
                .email("not-an-email")
                .password("short") // min 8
                .fullName("")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.username").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.email").isNotEmpty());
    }

    @Test
    @DisplayName("Should deny unauthenticated requests to protected endpoints")
    void shouldDenyUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
