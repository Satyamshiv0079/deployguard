package com.deployguard.config;

import com.deployguard.audit.AuditService;
import com.deployguard.entity.Role;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.entity.enums.RoleType;
import com.deployguard.repository.RoleRepository;
import com.deployguard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.Set;

@Component
@Order(1)
@RequiredArgsConstructor
public class SecurityBootstrapInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SecurityBootstrapInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Value("${app.security.initial-admin.username:admin}")
    private String initialAdminUsername;

    @Value("${app.security.initial-admin.email:admin@deployguard.internal}")
    private String initialAdminEmail;

    @Value("${app.security.initial-admin.password:}")
    private String initialAdminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        initializeRoles();
        initializeAdminUser();
    }

    private void initializeRoles() {
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                roleRepository.save(new Role(roleType));
                log.info("Initialized essential system role: {}", roleType);
            }
        }
    }

    private void initializeAdminUser() {
        Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN missing from role repository."));

        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(u -> u.getRoles() != null && u.getRoles().contains(adminRole));

        if (!adminExists && userRepository.findByUsername(initialAdminUsername).isEmpty()) {
            String passwordToUse;
            boolean generated = false;

            if (initialAdminPassword != null && !initialAdminPassword.isBlank()) {
                passwordToUse = initialAdminPassword.trim();
            } else {
                passwordToUse = generateSecureRandomPassword();
                generated = true;
            }

            Set<Role> roles = new HashSet<>(roleRepository.findAll());

            User admin = userRepository.save(User.builder()
                    .username(initialAdminUsername)
                    .email(initialAdminEmail)
                    .password(passwordEncoder.encode(passwordToUse))
                    .fullName("System Administrator")
                    .department("Enterprise IT Architecture")
                    .active(true)
                    .roles(roles)
                    .build());

            if (generated) {
                log.warn("========================================================================");
                log.warn("SECURITY ALERT: Initial administrator account provisioned with a secure random password.");
                log.warn("Username: {}", initialAdminUsername);
                log.warn("Temporary One-Time Password: {}", passwordToUse);
                log.warn("Please change this password immediately upon first login!");
                log.warn("========================================================================");
            } else {
                log.info("Initial administrator account '{}' provisioned successfully.", initialAdminUsername);
            }

            auditService.logSecurityEvent(
                    "system",
                    AuditAction.USER_CREATED,
                    "USER",
                    admin.getId().toString(),
                    "Initial administrator account provisioned safely."
            );
        }
    }

    private String generateSecureRandomPassword() {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(20);
        for (int i = 0; i < 20; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
