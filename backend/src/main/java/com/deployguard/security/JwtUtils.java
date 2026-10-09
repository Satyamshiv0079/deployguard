package com.deployguard.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

import jakarta.annotation.PostConstruct;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    @Autowired(required = false)
    private Environment environment;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private SecretKey signingKey;

    @PostConstruct
    public void initAndValidateKey() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL SECURITY ERROR: 'app.jwt.secret' must be configured.");
        }

        String trimmed = jwtSecret.trim();
        List<String> forbiddenPlaceholders = List.of(
                "replace_with",
                "your_secure_random",
                "change_me",
                "changeme",
                "placeholder",
                "default_secret"
        );
        for (String placeholder : forbiddenPlaceholders) {
            if (trimmed.toLowerCase().contains(placeholder)) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: Placeholder or default secret detected in 'app.jwt.secret'. You must configure a unique, secure secret.");
            }
        }

        // Prevent usage of known test-only keys in non-test environments
        if (environment != null && !Arrays.asList(environment.getActiveProfiles()).contains("test")) {
            List<String> testSecretKeywords = List.of(
                    "test-only",
                    "dGVzdC1kZXZlbG9wbWVud",
                    "ZGVwbG95Z3VhcmQtdGVzdC1vbmx5"
            );
            for (String kw : testSecretKeywords) {
                if (trimmed.contains(kw)) {
                    throw new IllegalStateException("CRITICAL SECURITY ERROR: Test-only JWT secret detected in non-test runtime environment. A secure, unique production secret must be provided.");
                }
            }
        }

        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret.trim());
        } catch (Exception e) {
            keyBytes = jwtSecret.trim().getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException("CRITICAL SECURITY ERROR: Configured JWT secret is " + (keyBytes.length * 8) +
                    " bits. HMAC-SHA signing requires a minimum of 256 bits (32 bytes).");
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private SecretKey getSigningKey() {
        return this.signingKey;
    }

    public String generateJwtToken(UserDetailsImpl userPrincipal) {
        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("id", userPrincipal.getId().toString())
                .claim("email", userPrincipal.getEmail())
                .claim("fullName", userPrincipal.getFullName())
                .claim("roles", roles)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT verification failed: {}", e.getMessage());
        }
        return false;
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }
}
