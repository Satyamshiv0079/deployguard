package com.deployguard.service.impl;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.UpdateUserRolesRequest;
import com.deployguard.dto.response.UserProfileResponse;
import com.deployguard.entity.Role;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.entity.enums.RoleType;
import com.deployguard.exception.BadRequestException;
import com.deployguard.exception.ResourceNotFoundException;
import com.deployguard.mapper.UserMapper;
import com.deployguard.repository.RoleRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toProfileResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(UUID id) {
        return userRepository.findById(id)
                .map(userMapper::toProfileResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Override
    @Transactional
    public UserProfileResponse updateUserRoles(UUID id, UpdateUserRolesRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        Set<Role> updatedRoles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            String normalized = roleName.trim().toUpperCase();
            if (!normalized.startsWith("ROLE_")) {
                normalized = "ROLE_" + normalized;
            }
            try {
                RoleType roleType = RoleType.valueOf(normalized);
                Role role = roleRepository.findByName(roleType)
                        .orElseGet(() -> roleRepository.save(new Role(roleType)));
                updatedRoles.add(role);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role specified: " + roleName);
            }
        }

        user.setRoles(updatedRoles);
        User savedUser = userRepository.save(user);

        String rolesSummary = updatedRoles.stream()
                .map(r -> r.getName().name())
                .collect(Collectors.joining(", "));

        auditService.logCurrent(AuditAction.USER_UPDATED, "USER", savedUser.getId().toString(),
                "Administrator updated roles for user '" + savedUser.getUsername() + "' to: [" + rolesSummary + "]");

        return userMapper.toProfileResponse(savedUser);
    }
}
