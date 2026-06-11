package com.heytea.agent.controller;

import com.heytea.agent.common.Result;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * File upload controller — handles image uploads for food safety evidence.
 */
@Slf4j
@RestController
@RequestMapping("/upload")
public class FileUploadController {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${server.port:8081}")
    private int serverPort;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/webp"
    );

    @PostMapping("/image")
    public Result<Map<String, Object>> uploadImage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("file") MultipartFile file) {

        // Optional auth check
        Long userId = extractUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        // Validate file type
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            return Result.error(400, "不支持的文件类型，仅支持 PNG/JPEG/GIF/WebP");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            return Result.error(400, "文件过大，最大支持 10MB");
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename with date-based subdirectory
            String datePrefix = java.time.LocalDate.now().toString().replace("-", "/");
            Path datePath = uploadPath.resolve(datePrefix);
            if (!Files.exists(datePath)) {
                Files.createDirectories(datePath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueName = UUID.randomUUID() + extension;

            Path filePath = datePath.resolve(uniqueName);
            file.transferTo(filePath.toFile());

            String fileUrl = String.format("/api/uploads/%s/%s", datePrefix, uniqueName);
            log.info("File uploaded: {} -> {} (user={})", originalFilename, fileUrl, userId);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("url", fileUrl);
            result.put("filename", originalFilename);
            result.put("size", file.getSize());
            result.put("type", file.getContentType());

            return Result.success(result);

        } catch (IOException e) {
            log.error("File upload failed", e);
            return Result.error(500, "文件上传失败: " + e.getMessage());
        }
    }

    /**
     * Batch upload — accept multiple images in a single request.
     */
    @PostMapping("/images")
    public Result<List<Map<String, Object>>> uploadImages(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("files") MultipartFile[] files) {

        Long userId = extractUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        if (files.length > 3) {
            return Result.error(400, "最多支持同时上传 3 张图片");
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!ALLOWED_TYPES.contains(file.getContentType()) || file.getSize() > MAX_FILE_SIZE) {
                continue; // skip invalid files
            }
            try {
                Path uploadPath = Paths.get(uploadDir);
                String datePrefix = java.time.LocalDate.now().toString().replace("-", "/");
                Path datePath = uploadPath.resolve(datePrefix);
                if (!Files.exists(datePath)) {
                    Files.createDirectories(datePath);
                }

                String extension = "";
                String originalFilename = file.getOriginalFilename();
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String uniqueName = UUID.randomUUID() + extension;
                Path filePath = datePath.resolve(uniqueName);
                file.transferTo(filePath.toFile());

                Map<String, Object> r = new LinkedHashMap<>();
                r.put("url", String.format("/api/uploads/%s/%s", datePrefix, uniqueName));
                r.put("filename", originalFilename);
                r.put("size", file.getSize());
                results.add(r);
            } catch (IOException e) {
                log.error("Batch upload failed for file: {}", file.getOriginalFilename(), e);
            }
        }

        return Result.success(results);
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
