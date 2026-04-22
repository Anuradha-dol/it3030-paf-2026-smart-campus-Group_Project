package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.BookingRequestDTO;
import com.smartcampus.dto.BookingResponseDTO;
import com.smartcampus.dto.BookingStatusUpdateDTO;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponseDTO>> createBooking(
            @Valid @RequestBody BookingRequestDTO bookingRequestDTO) {

        BookingResponseDTO createdBooking = bookingService.createBooking(bookingRequestDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, createdBooking, null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingResponseDTO>>> getAllBookings() {
        List<BookingResponseDTO> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(new ApiResponse<>(true, bookings, null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<BookingResponseDTO>>> searchBookings(
            @RequestParam(required = false) String facility,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) BookingStatus status
    ) {
        List<BookingResponseDTO> results = bookingService.searchBookings(facility, date, status);
        return ResponseEntity.ok(new ApiResponse<>(true, results, null));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<BookingResponseDTO>> getBookingById(@PathVariable Long id) {
        BookingResponseDTO booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, booking, null));
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<BookingResponseDTO>> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingRequestDTO dto) {

        BookingResponseDTO updatedBooking = bookingService.updateBooking(id, dto);
        return ResponseEntity.ok(new ApiResponse<>(true, updatedBooking, null));
    }

    @PatchMapping("/{id:\\d+}/status")
    public ResponseEntity<ApiResponse<BookingResponseDTO>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusUpdateDTO dto) {

        BookingResponseDTO updatedBooking = bookingService.updateStatus(id, dto.getStatus());
        return ResponseEntity.ok(new ApiResponse<>(true, updatedBooking, null));
    }

    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<String>> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Booking deleted successfully", null));
    }
}