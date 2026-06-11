package com.heytea.agent.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.heytea.agent.common.Result;
import com.heytea.agent.entity.AuditLog;
import com.heytea.agent.entity.User;
import com.heytea.agent.mapper.AuditLogMapper;
import com.heytea.agent.mapper.UserMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Admin controller — user management and audit log queries.
 * All endpoints require admin role.
 */
@Slf4j
@RestController
@RequestMapping("/admin")
public class AdminController {

    @Resource
    private UserMapper userMapper;

    @Resource
    private AuditLogMapper auditLogMapper;

    @Value("${jwt.secret}")
    private String jwtSecret;

    // ──────────────────────────────────────────
    // GET /admin/users
    // ──────────────────────────────────────────

    @GetMapping("/users")
    public Result<List<User>> listUsers(
            @RequestHeader("Authorization") String authHeader) {

        Long adminId = extractUserIdFromToken(authHeader);
        if (adminId == null) {
            return Result.error(401, "Invalid or expired token");
        }
        if (!isAdmin(adminId)) {
            return Result.error(403, "Admin access required");
        }

        List<User> users = userMapper.selectList(null);

        // Strip passwords from the response
        users.forEach(u -> u.setPassword(null));

        return Result.success(users);
    }

    // ──────────────────────────────────────────
    // PUT /admin/users/{id}/role
    // ──────────────────────────────────────────

    @PutMapping("/users/{id}/role")
    public Result<Void> updateUserRole(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Long adminId = extractUserIdFromToken(authHeader);
        if (adminId == null) {
            return Result.error(401, "Invalid or expired token");
        }
        if (!isAdmin(adminId)) {
            return Result.error(403, "Admin access required");
        }

        String newRole = body.get("role");
        if (!StringUtils.hasText(newRole)) {
            return Result.error(400, "Role is required");
        }

        // Validate role value
        if (!List.of("consumer", "agent", "admin").contains(newRole)) {
            return Result.error(400, "Invalid role. Must be one of: consumer, agent, admin");
        }

        User user = userMapper.selectById(id);
        if (user == null) {
            return Result.error(404, "User not found");
        }

        user.setRole(newRole);
        userMapper.updateById(user);

        log.info("Admin {} updated user {} role to {}", adminId, id, newRole);

        return Result.success();
    }

    // ──────────────────────────────────────────
    // GET /admin/audit-logs
    // ──────────────────────────────────────────

    @GetMapping("/audit-logs")
    public Result<IPage<AuditLog>> auditLogs(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long userId) {

        Long adminId = extractUserIdFromToken(authHeader);
        if (adminId == null) {
            return Result.error(401, "Invalid or expired token");
        }
        if (!isAdmin(adminId)) {
            return Result.error(403, "Admin access required");
        }

        LambdaQueryWrapper<AuditLog> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(action)) {
            wrapper.eq(AuditLog::getAction, action);
        }
        if (userId != null) {
            wrapper.eq(AuditLog::getUserId, userId);
        }

        wrapper.orderByDesc(AuditLog::getCreatedAt);

        IPage<AuditLog> result = auditLogMapper.selectPage(
                new Page<>(page, size), wrapper);

        return Result.success(result);
    }

    // ──────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────

    /**
     * Check whether the given user has admin role.
     */
    private boolean isAdmin(Long userId) {
        User user = userMapper.selectById(userId);
        return user != null && "admin".equals(user.getRole());
    }

    private Long extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            String token = authHeader.substring(7);
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String subject = claims.getSubject();
            return subject != null ? Long.parseLong(subject) : null;
        } catch (Exception e) {
            log.warn("Failed to parse JWT token: {}", e.getMessage());
            return null;
        }
    }
}
