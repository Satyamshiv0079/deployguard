package com.deployguard.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import org.mockito.Mockito;
import org.springframework.core.env.Environment;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    @Test
    @DisplayName("Should reject missing or empty JWT secret at startup")
    void shouldRejectMissingJwtSecret() {
        JwtUtils jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "");

        IllegalStateException ex = assertThrows(IllegalStateException.class, jwtUtils::initAndValidateKey);
        assertTrue(ex.getMessage().contains("must be configured"));
    }

    @Test
    @DisplayName("Should reject weak JWT secret that does not meet 256-bit requirement")
    void shouldRejectWeakJwtSecret() {
        JwtUtils jwtUtils = new JwtUtils();
        // 16 characters (128 bits) - below the 256-bit requirement
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "too-short-secret");

        IllegalStateException ex = assertThrows(IllegalStateException.class, jwtUtils::initAndValidateKey);
        assertTrue(ex.getMessage().contains("minimum of 256 bits"));
    }

    @Test
    @DisplayName("Should reject placeholder or template secret at startup")
    void shouldRejectPlaceholderSecret() {
        JwtUtils jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "your_secure_random_base64_or_hex_encoded_key_min_256_bits");

        IllegalStateException ex = assertThrows(IllegalStateException.class, jwtUtils::initAndValidateKey);
        assertTrue(ex.getMessage().contains("Placeholder or default secret detected"));
    }

    @Test
    @DisplayName("Should successfully initialize with deterministic test-only secret in test environment")
    void shouldAcceptValidDeterministicTestSecret() {
        JwtUtils jwtUtils = new JwtUtils();
        Environment env = Mockito.mock(Environment.class);
        Mockito.when(env.getActiveProfiles()).thenReturn(new String[]{"test"});
        ReflectionTestUtils.setField(jwtUtils, "environment", env);
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "ZGVwbG95Z3VhcmQtdGVzdC1vbmx5LWRldGVybWluaXN0aWMtMjU2Yml0LXNpZ25pbmcta2V5IQ==");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L);

        assertDoesNotThrow(jwtUtils::initAndValidateKey);
    }

    @Test
    @DisplayName("Should strictly reject test-only secret when starting up in production profile")
    void shouldRejectTestSecretInProductionEnvironment() {
        JwtUtils jwtUtils = new JwtUtils();
        Environment env = Mockito.mock(Environment.class);
        Mockito.when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        ReflectionTestUtils.setField(jwtUtils, "environment", env);
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "ZGVwbG95Z3VhcmQtdGVzdC1vbmx5LWRldGVybWluaXN0aWMtMjU2Yml0LXNpZ25pbmcta2V5IQ==");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, jwtUtils::initAndValidateKey);
        assertTrue(ex.getMessage().contains("Test-only JWT secret detected in non-test runtime environment"));
    }

    @Test
    @DisplayName("Should successfully accept valid 256-bit production secret in production profile")
    void shouldAcceptValidProductionSecretInProductionProfile() {
        JwtUtils jwtUtils = new JwtUtils();
        Environment env = Mockito.mock(Environment.class);
        Mockito.when(env.getActiveProfiles()).thenReturn(new String[]{"prod"});
        ReflectionTestUtils.setField(jwtUtils, "environment", env);
        // Valid 256-bit base64 production key without test keywords
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "c3VwZXJTZWN1cmVQcm9kdWN0aW9uS2V5TXVzdEJlQXRMZWFzdDI1NkJpdHMyMDI2IQ==");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 86400000L);

        assertDoesNotThrow(jwtUtils::initAndValidateKey);
    }
}
