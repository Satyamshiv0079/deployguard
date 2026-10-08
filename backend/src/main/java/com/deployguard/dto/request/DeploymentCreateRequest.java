package com.deployguard.dto.request;

import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentCreateRequest {

    @NotNull(message = "Project ID is required")
    private UUID projectId;

    @NotBlank(message = "Version is required")
    @Size(max = 50, message = "Version must be less than 50 characters")
    private String version;

    @NotNull(message = "Environment is required")
    private DeploymentEnvironment environment;

    @NotBlank(message = "Reason is required")
    @Size(max = 500, message = "Reason must be less than 500 characters")
    private String reason;

    private String changeDescription;

    @NotNull(message = "Risk level is required")
    @Builder.Default
    private Priority riskLevel = Priority.MEDIUM;
}
