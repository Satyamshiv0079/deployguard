package com.deployguard.service;

import com.deployguard.dto.response.UserProfileResponse;

import java.util.List;
import java.util.UUID;

public interface UserService {
    List<UserProfileResponse> getAllUsers();
    UserProfileResponse getUserById(UUID id);
}
