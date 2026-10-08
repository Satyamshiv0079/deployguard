package com.deployguard.service;

import com.deployguard.dto.request.LoginRequest;
import com.deployguard.dto.request.RegisterRequest;
import com.deployguard.dto.response.AuthResponse;
import com.deployguard.dto.response.UserProfileResponse;

public interface AuthService {
    AuthResponse login(LoginRequest loginRequest);
    UserProfileResponse register(RegisterRequest registerRequest);
    UserProfileResponse getCurrentUserProfile();
}
