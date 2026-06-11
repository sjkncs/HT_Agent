package com.heytea.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 64, message = "用户名长度 2-64")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 128, message = "密码长度 6-128")
    private String password;

    private String nickname;
}
