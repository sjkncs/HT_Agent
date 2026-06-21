package com.heytea.agent.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * JWT utility — token parsing and user ID extraction.
 * Eliminates duplication across ChatController, AuthController, ConversationController.
 */
@Slf4j
public final class JwtUtil {

    private JwtUtil() {}

    /**
     * Extract userId from the Authorization header (Bearer token).
     * @return userId or null if token is invalid/missing
     */
    public static Long extractUserId(String authHeader, String jwtSecret) {
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

    /**
     * Extract a specific claim from the Authorization header.
     */
    public static String extractClaim(String authHeader, String jwtSecret, String claimName) {
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

            return claims.get(claimName, String.class);
        } catch (Exception e) {
            log.warn("Failed to parse JWT claim: {}", e.getMessage());
            return null;
        }
    }
}
