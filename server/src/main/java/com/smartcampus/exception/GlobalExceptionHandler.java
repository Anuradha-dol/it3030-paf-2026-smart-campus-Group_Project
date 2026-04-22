package com.smartcampus.exception;

import com.smartcampus.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });

        ApiResponse<Object> response = new ApiResponse<>(false, null, errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BookingNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleBookingNotFoundException(BookingNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());

        ApiResponse<Object> response = new ApiResponse<>(false, null, error);
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BookingConflictException.class)
    public ResponseEntity<ApiResponse<Object>> handleBookingConflictException(BookingConflictException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());

        ApiResponse<Object> response = new ApiResponse<>(false, null, error);
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidBookingException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidBookingException(InvalidBookingException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());

        ApiResponse<Object> response = new ApiResponse<>(false, null, error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());

        ApiResponse<Object> response = new ApiResponse<>(false, null, error);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}