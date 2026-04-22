package com.smartcampus.service;

import com.smartcampus.dto.BookingRequestDTO;
import com.smartcampus.dto.BookingResponseDTO;
import com.smartcampus.entity.Booking;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.BookingNotFoundException;
import com.smartcampus.exception.InvalidBookingException;
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
            throw new InvalidBookingException("Booking date cannot be in the past");
        }

        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new InvalidBookingException("End time must be after start time");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                dto.getFacilityName(),
                dto.getBookingDate(),
                dto.getStartTime(),
                dto.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new BookingConflictException("Time slot already booked for this facility");
        }

        Booking booking = new Booking();
        booking.setFacilityName(dto.getFacilityName().trim());
        booking.setBookedBy(dto.getBookedBy().trim());
        booking.setBookingDate(dto.getBookingDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setAttendees(dto.getAttendees());
        booking.setPurpose(dto.getPurpose().trim());
        booking.setStatus(BookingStatus.PENDING);

        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponseDTO(savedBooking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));
    }

    public BookingResponseDTO updateBooking(Long id, BookingRequestDTO dto) {

        Booking existingBooking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        if (dto.getBookingDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingException("Booking date cannot be in the past");
        }

        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new InvalidBookingException("End time must be after start time");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                dto.getFacilityName(),
                dto.getBookingDate(),
                dto.getStartTime(),
                dto.getEndTime()
        );

        boolean hasRealConflict = conflicts.stream()
                .anyMatch(booking -> !booking.getId().equals(id));

        if (hasRealConflict) {
            throw new BookingConflictException("Time slot already booked for this facility");
        }

        existingBooking.setFacilityName(dto.getFacilityName().trim());
        existingBooking.setBookedBy(dto.getBookedBy().trim());
        existingBooking.setBookingDate(dto.getBookingDate());
        existingBooking.setStartTime(dto.getStartTime());
        existingBooking.setEndTime(dto.getEndTime());
        existingBooking.setAttendees(dto.getAttendees());
        existingBooking.setPurpose(dto.getPurpose().trim());

        Booking updatedBooking = bookingRepository.save(existingBooking);
        return mapToResponseDTO(updatedBooking);
    }

    public BookingResponseDTO updateStatus(Long id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new InvalidBookingException("Cancelled booking status cannot be changed");
        }

        booking.setStatus(status);

        Booking updatedBooking = bookingRepository.save(booking);
        return mapToResponseDTO(updatedBooking);
    }

    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        bookingRepository.delete(booking);
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