package com.deployguard.service.impl;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.LoginRequest;
import com.deployguard.dto.request.RegisterRequest;
import com.deployguard.dto.response.AuthResponse;
import com.deployguard.dto.response.UserProfileResponse;
import com.deployguard.entity.Role;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.entity.enums.RoleType;
import com.deployguard.exception.BadRequestException;
import com.deployguard.exception.ConflictException;
import com.deployguard.exception.ResourceNotFoundException;
import com.deployguard.mapper.UserMapper;
import com.deployguard.repository.RoleRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.security.JwtUtils;
import com.deployguard.security.UserDetailsImpl;
import com.deployguard.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;
    private final AuditService auditService;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        String jwt = jwtUtils.generateJwtToken(userPrincipal);

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        auditService.log(userPrincipal.getUsername(), AuditAction.LOGIN, "AUTH", userPrincipal.getId().toString(),
                "User logged in successfully");

        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(userPrincipal.getId())
                .username(userPrincipal.getUsername())
                .email(userPrincipal.getEmail())
                .fullName(userPrincipal.getFullName())
                .department(userPrincipal.getDepartment())
                .roles(roles)
                .expiresInMs(jwtUtils.getJwtExpirationMs())
                .build();
    }

    @Override
    @Transactional
    public UserProfileResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new ConflictException("Username is already taken: " + registerRequest.getUsername());
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ConflictException("Email is already registered: " + registerRequest.getEmail());
        }

        Set<Role> roles = new HashSet<>();
        if (registerRequest.getRoles() == null || registerRequest.getRoles().isEmpty()) {
            Role defaultRole = roleRepository.findByName(RoleType.ROLE_DEVELOPER)
                    .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_DEVELOPER)));
            roles.add(defaultRole);
        } else {
            for (String roleName : registerRequest.getRoles()) {
                String normalized = roleName.trim().toUpperCase();
                if (!normalized.startsWith("ROLE_")) {
                    normalized = "ROLE_" + normalized;
                }
                try {
                    RoleType roleType = RoleType.valueOf(normalized);
                    Role role = roleRepository.findByName(roleType)
                            .orElseGet(() -> roleRepository.save(new Role(roleType)));
                    roles.add(role);
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid role specified: " + roleName);
                }
            }
        }

        User user = User.builder()
                .username(registerRequest.getUsername().trim())
                .email(registerRequest.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .fullName(registerRequest.getFullName().trim())
                .department(registerRequest.getDepartment())
                .active(true)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        auditService.log(savedUser.getUsername(), AuditAction.USER_CREATED, "USER", savedUser.getId().toString(),
                "New user registered with roles: " + roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", ")));

        return userMapper.toProfileResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ResourceNotFoundException("No active authenticated session found.");
        }

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found."));

        return userMapper.toProfileResponse(user);
    }
}
