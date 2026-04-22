package com.smartcampus.controller;

import com.smartcampus.dto.AuthResponse;
import com.smartcampus.dto.UserDto;
import com.smartcampus.enums.Token;
import com.smartcampus.model.User;
import com.smartcampus.records.LoginRequest;
import com.smartcampus.repository.UserRepo;
import com.smartcampus.service.AuthService;
import com.smartcampus.utils.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepo userRepo;
    private final JwtUtils jwtUtils;

    // ================= REGISTER =================
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody UserDto.RegisterRequest req,
            HttpServletResponse response
    ) {

        AuthResponse res = authService.signUp(req);

        Cookie cookie = new Cookie("userEmail", req.email());
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(30 * 60);

        response.addCookie(cookie);

        return ResponseEntity.ok(res);
    }

    // ================= LOGIN =================
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest req,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.signIn(req, response));
    }

    // ================= VERIFY OTP =================
    @PostMapping("/verify-code")
    public ResponseEntity<AuthResponse> verify(
            @RequestBody UserDto.VerifyCodeDto dto,
            HttpServletRequest request
    ) {

        String email = getCookie(request, "userEmail");

        if (email == null) {
            return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                            .message("Email not found")
                            .success(false)
                            .build());
        }

        return ResponseEntity.ok(authService.verifyCode(email, dto.verifyCode()));
    }

    // ================= RESEND OTP =================
    @PostMapping("/resend-otp")
    public ResponseEntity<AuthResponse> resend(HttpServletRequest request) {

        String email = getCookie(request, "userEmail");

        if (email == null) {
            return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                            .message("Email not found")
                            .success(false)
                            .build());
        }

        return ResponseEntity.ok(authService.resendOtp(email));
    }

    // ================= LOGOUT =================
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        // Clear JWT tokens
        jwtUtils.removeToken(response, Token.ACCESS);
        jwtUtils.removeToken(response, Token.REFRESH);

        return ResponseEntity.ok(Map.of("message", "Logout successful"));
    }

    // ================= PHONE CHECK =================
    @PostMapping("/check-phone")
    public ResponseEntity<Map<String, Boolean>> checkPhone(@RequestBody Map<String, String> body) {

        String phone = body.get("phoneNumber");
        boolean available = userRepo.findByPhoneNumber(phone).isEmpty();

        return ResponseEntity.ok(Map.of("available", available));
    }

    // ================= ME =================
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userRepo.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("user", user);
        response.put("provider", user.getProvider());
        response.put("authenticated", true);

        return ResponseEntity.ok(response);
    }

    // ================= REFRESH =================
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookie(request, "REFRESH");

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "No refresh token"));
        }

        try {
            String username = jwtUtils.extractUsername(refreshToken);
            User user = userRepo.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));

            // Validate the token and check if it matches the user's stored refresh token
            if (jwtUtils.validateToken(refreshToken, user) && refreshToken.equals(user.getRefreshToken())) {
                Map<String, Object> claims = new java.util.HashMap<>();
                claims.put("email", user.getEmail());
                claims.put("role", user.getRole().name());

                String newAccessToken = jwtUtils.generateToken(claims, user, response, Token.ACCESS);
                String newRefreshToken = jwtUtils.generateToken(claims, user, response, Token.REFRESH);

                user.setRefreshToken(newRefreshToken);
                userRepo.save(user);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "accessToken", newAccessToken,
                        "refreshToken", newRefreshToken
                ));
            } else {
                return ResponseEntity.status(403).body(Map.of("message", "Invalid refresh token"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("message", "Invalid refresh token"));
        }
    }

    // ================= COOKIE HELPER =================
    private String getCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;

        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
