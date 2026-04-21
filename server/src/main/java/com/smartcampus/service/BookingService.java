package com.smartcampus.service;

import com.smartcampus.dto.BookingRequestDTO;
import com.smartcampus.dto.BookingResponseDTO;
import com.smartcampus.entity.Booking;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    public BookingResponseDTO createBooking(BookingRequestDTO dto) {
        if (dto.getBookingDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Booking date cannot be in the past");
        }

        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        Booking booking = new Booking();
        booking.setFacilityName(dto.getFacilityName());
        booking.setBookedBy(dto.getBookedBy());
        booking.setBookingDate(dto.getBookingDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setAttendees(dto.getAttendees());
        booking.setPurpose(dto.getPurpose());
        booking.setStatus(BookingStatus.PENDING);

        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponseDTO(savedBooking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id).orElse(null);
    }

    public Booking updateStatus(Long id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id).orElse(null);

        if (booking != null) {
            booking.setStatus(status);
            return bookingRepository.save(booking);
        }

        return null;
    }

    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    private BookingResponseDTO mapToResponseDTO(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(booking.getId());
        dto.setFacilityName(booking.getFacilityName());
        dto.setBookedBy(booking.getBookedBy());
        dto.setBookingDate(booking.getBookingDate());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setAttendees(booking.getAttendees());
        dto.setPurpose(booking.getPurpose());
        dto.setStatus(booking.getStatus());
        return dto;
    }
}