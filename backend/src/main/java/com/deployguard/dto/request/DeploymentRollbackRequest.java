package com.deployguard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentRollbackRequest {
    @NotBlank(message = "Rollback reason is required")
    @Size(max = 1000, message = "Rollback reason must be less than 1000 characters")
    private String reason;
}
