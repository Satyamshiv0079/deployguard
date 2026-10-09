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
    @DisplayName("Should successfully initialize with valid 256-bit secret")
    void shouldAcceptValid256BitSecret() {
        JwtUtils jwtUtils = new JwtUtils();
        // 32+ bytes secret
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L);

        assertDoesNotThrow(jwtUtils::initAndValidateKey);
    }
}
