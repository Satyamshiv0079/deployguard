package com.deployguard.security;

import com.deployguard.entity.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class SecretSecurityTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Should ensure User entity password hash is never serialized to JSON")
    void shouldNeverSerializePasswordHash() throws Exception {
        User user = User.builder()
                .username("test_user")
                .email("test@deployguard.internal")
                .password("$2a$10$syntheticHashedPasswordValue1234567890abcdef")
                .fullName("Test User")
                .build();

        String json = objectMapper.writeValueAsString(user);

        assertFalse(json.contains("syntheticHashedPasswordValue"), "Password hash was leaked in serialized JSON!");
        assertFalse(json.contains("\"password\""), "Password field was serialized in JSON!");
    }

    @Test
    @DisplayName("Should detect synthetic secret pattern in scanner without false negative")
    void shouldDetectSyntheticSecretInScanner() {
        Pattern awsKeyPattern = Pattern.compile("AKIA[0-9A-Z]{16}");
        Pattern gitHubPatPattern = Pattern.compile("ghp_[0-9a-zA-Z]{36}");

        // Synthetic test values matching format (concatenated to prevent static detector false positives)
        String syntheticAwsKey = "AKIA" + "IOSFODNN7EXAMPLE"; // gitleaks:allow
        String syntheticPat = "ghp_" + "1234567890" + "abcdefghijklmnopqrstuvwxyz"; // gitleaks:allow

        assertTrue(awsKeyPattern.matcher(syntheticAwsKey).find(), "Scanner failed to detect synthetic AWS key format!");
        assertTrue(gitHubPatPattern.matcher(syntheticPat).find(), "Scanner failed to detect synthetic GitHub PAT format!");
    }

    @Test
    @DisplayName("Should verify frontend production dist assets contain no private credentials or secret keys")
    void shouldVerifyFrontendDistHasNoPrivateSecrets() throws Exception {
        Path distPath = Path.of("../frontend/dist");
        if (!Files.exists(distPath)) {
            // Dist not yet built or running in container
            return;
        }

        Pattern privateKeyPattern = Pattern.compile("-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----");
        Pattern awsPattern = Pattern.compile("AKIA[0-9A-Z]{16}");

        File[] files = distPath.resolve("assets").toFile().listFiles((dir, name) -> name.endsWith(".js") || name.endsWith(".css"));
        if (files != null) {
            for (File file : files) {
                String content = Files.readString(file.toPath());
                assertFalse(privateKeyPattern.matcher(content).find(), "Private key pattern found in frontend bundle: " + file.getName());
                assertFalse(awsPattern.matcher(content).find(), "AWS key pattern found in frontend bundle: " + file.getName());
            }
        }
    }
}
