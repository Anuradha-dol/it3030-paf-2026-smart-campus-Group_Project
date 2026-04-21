package com.smartcampus.controller;

import com.smartcampus.dto.AuthResponse;
import com.smartcampus.dto.UserDto;
import com.smartcampus.enums.Token;
import com.smartcampus.records.LoginRequest;
import com.smartcampus.service.AuthService;
import com.smartcampus.utils.JwtUtils;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody UserDto.RegisterRequest request) {
        return ResponseEntity.ok(authService.signUp(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        return ResponseEntity.ok(authService.signIn(request, response));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<AuthResponse> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        return ResponseEntity.ok(authService.verifyCode(request.email(), request.verifyCode()));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<AuthResponse> resendOtp(@Valid @RequestBody EmailRequest request) {
        return ResponseEntity.ok(authService.resendOtp(request.email()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletResponse response) {
        jwtUtils.removeToken(response, Token.ACCESS);
        jwtUtils.removeToken(response, Token.REFRESH);
        jwtUtils.removeToken(response, Token.VERIFY);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Logout successful"
        ));
    }

    public record VerifyCodeRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Please provide a valid email")
            String email,

            @NotBlank(message = "Verification code is required")
            String verifyCode
    ) {
    }

    public record EmailRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Please provide a valid email")
            String email
    ) {
    }
}
