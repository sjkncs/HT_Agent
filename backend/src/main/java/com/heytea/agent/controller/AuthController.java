package com.heytea.agent.controller;

import com.heytea.agent.common.Result;
import com.heytea.agent.dto.LoginRequest;
import com.heytea.agent.dto.LoginResponse;
import com.heytea.agent.dto.RegisterRequest;
import com.heytea.agent.entity.User;
import com.heytea.agent.mapper.UserMapper;
import com.heytea.agent.util.JwtUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Authentication controller — login, register, current user info.
 */
@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Resource
    private UserMapper userMapper;

    @Resource
    private PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // ──────────────────────────────────────────
    // POST /auth/login
    // ──────────────────────────────────────────

    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        // 1. Look up user by username
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername()));
        if (user == null) {
            return Result.error(401, "User not found");
        }

        // 2. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return Result.error(401, "Invalid credentials");
        }

        // 3. Check account status
        if (user.getStatus() != null && user.getStatus() == 0) {
            return Result.error(403, "Account is disabled");
        }

        // 4. Generate JWT token
        String token = generateToken(user);
        log.info("User {} logged in successfully", user.getUsername());

        // 5. Build response
        LoginResponse response = LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .role(user.getRole())
                .build();

        return Result.success(response);
    }

    // ──────────────────────────────────────────
    // POST /auth/register
    // ──────────────────────────────────────────

    @PostMapping("/register")
    public Result<Void> register(@RequestBody RegisterRequest request) {
        log.info("Registration attempt for user: {}", request.getUsername());

        // 1. Check if username already exists
        User existing = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername()));
        if (existing != null) {
            return Result.error(409, "Username already exists");
        }

        // 2. Create new user
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role("consumer")
                .status(1)
                .build();

        userMapper.insert(user);
        log.info("User {} registered successfully", user.getUsername());

        return Result.success();
    }

    // ──────────────────────────────────────────
    // GET /auth/me
    // ──────────────────────────────────────────

    @GetMapping("/me")
    public Result<Map<String, Object>> me(@RequestHeader("Authorization") String authHeader) {
        Long userId = JwtUtil.extractUserId(authHeader, jwtSecret);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            return Result.error(404, "User not found");
        }

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("role", user.getRole());
        userInfo.put("avatarUrl", user.getAvatarUrl());
        userInfo.put("status", user.getStatus());
        userInfo.put("createdAt", user.getCreatedAt());

        return Result.success(userInfo);
    }

    // ──────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────

    /**
     * Generate a JWT token for the given user.
     */
    private String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("username", user.getUsername())
                .claim("role", user.getRole())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }
}
