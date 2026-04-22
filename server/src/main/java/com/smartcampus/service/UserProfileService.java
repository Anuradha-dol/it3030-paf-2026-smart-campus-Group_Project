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

    // ================= PROFILE FIELDS =================
    void updatePhoneNumber(User user, String phoneNumber);
    
    void updateYear(User user, String year);
    
    void updateSemester(User user, String semester);
    
    void updateProfileField(User user, UserDto.UpdateProfileFieldDto dto);

    // ================= ACCOUNT DELETE =================
    void deleteAccount(User user, UserDto.DeleteAccountDto dto);
    void deleteOAuthAccount(User user);

    void requestDeletion(User user);

    void verifyAndDelete(User user, UserDto.DeleteAccountForgotVerifyDto dto);
}
