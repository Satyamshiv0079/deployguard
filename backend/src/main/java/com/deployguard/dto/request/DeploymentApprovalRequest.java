package com.deployguard.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentApprovalRequest {
    @Size(max = 1000, message = "Comments must be less than 1000 characters")
    private String comments;
}
