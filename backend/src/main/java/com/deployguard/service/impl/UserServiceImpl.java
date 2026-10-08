package com.deployguard.service.impl;

import com.deployguard.dto.response.UserProfileResponse;
import com.deployguard.exception.ResourceNotFoundException;
import com.deployguard.mapper.UserMapper;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

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
}
