package com.deployguard.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

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
    @DisplayName("Should successfully initialize with valid 256-bit synthetic secret")
    void shouldAcceptValid256BitSecret() {
        JwtUtils jwtUtils = new JwtUtils();
        // Synthetic 256-bit base64 key
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "dGVzdC1kZXZlbG9wbWVudC1vbmx5LWtleS1ub3QtZm9yLXByb2R1Y3Rpb24tdXNlLTI1NmJpdHM=");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L);

        assertDoesNotThrow(jwtUtils::initAndValidateKey);
    }
}
