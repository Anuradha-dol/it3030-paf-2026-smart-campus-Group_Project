package com.smartcampus.service;

import com.smartcampus.dto.UserDto;
import com.smartcampus.model.User;

public interface UserProfileService {

    // ================= PROFILE =================
    UserDto.UserProfileDto getProfile(Long userId);

    UserDto.UserHomeDto getUserHome(Long userId);

    User getCurrentUser(String email);

    // ================= NAME =================
    UserDto.UpdateNameDto updateName(User user, UserDto.UpdateNameDto dto);

    // ================= EMAIL =================
    UserDto.UpdateEmailDto updateEmail(User user, UserDto.UpdateEmailDto dto);

    void verifyNewEmail(User user, String otp);

    // ================= PASSWORD =================
    void updatePassword(User user, UserDto.UpdatePasswordDto dto);

    // ================= ACCOUNT DELETE =================
    void deleteAccount(User user);

    void requestDeletion(User user);

    void verifyAndDelete(User user, UserDto.DeleteAccountForgotVerifyDto dto);
}
