package com.smartcampus.service;

import com.smartcampus.dto.BookingRequestDTO;
import com.smartcampus.dto.BookingResponseDTO;
import com.smartcampus.dto.DashboardStatsDTO;
import com.smartcampus.entity.Booking;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    public BookingResponseDTO createBooking(BookingRequestDTO dto) {

        validateTimeRange(dto);
        validateConflict(dto, null);

        Booking booking = new Booking();
        booking.setFacilityName(dto.getFacilityName());
        booking.setBookingDate(dto.getBookingDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setAttendees(dto.getAttendees());
        booking.setPurpose(dto.getPurpose());
        booking.setBookedBy(dto.getBookedBy());

        // Set default status
        booking.setStatus(BookingStatus.PENDING);

        Booking savedBooking = bookingRepository.save(booking);
        return mapToDTO(savedBooking);
    }

    public BookingResponseDTO updateBooking(Long id, BookingRequestDTO dto) {
        Booking existingBooking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateTimeRange(dto);
        validateConflict(dto, id);

        existingBooking.setFacilityName(dto.getFacilityName());
        existingBooking.setBookingDate(dto.getBookingDate());
        existingBooking.setStartTime(dto.getStartTime());
        existingBooking.setEndTime(dto.getEndTime());
        existingBooking.setAttendees(dto.getAttendees());
        existingBooking.setPurpose(dto.getPurpose());
        existingBooking.setBookedBy(dto.getBookedBy());

        Booking updatedBooking = bookingRepository.save(existingBooking);
        return mapToDTO(updatedBooking);
    }

    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public BookingResponseDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToDTO(booking);
    }

    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        bookingRepository.delete(booking);
    }

    public BookingResponseDTO updateStatus(Long id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(status);
        Booking updatedBooking = bookingRepository.save(booking);
        return mapToDTO(updatedBooking);
    }

    public List<BookingResponseDTO> searchBookings(String facility, LocalDate date, BookingStatus status) {
        List<Booking> bookings;

        if (facility != null && !facility.isBlank() && date != null && status != null) {
            bookings = bookingRepository.findByFacilityNameContainingIgnoreCaseAndBookingDateAndStatus(facility, date, status);
        } else if (facility != null && !facility.isBlank() && date != null) {
            bookings = bookingRepository.findByFacilityNameContainingIgnoreCaseAndBookingDate(facility, date);
        } else if (facility != null && !facility.isBlank() && status != null) {
            bookings = bookingRepository.findByFacilityNameContainingIgnoreCaseAndStatus(facility, status);
        } else if (date != null && status != null) {
            bookings = bookingRepository.findByBookingDateAndStatus(date, status);
        } else if (facility != null && !facility.isBlank()) {
            bookings = bookingRepository.findByFacilityNameContainingIgnoreCase(facility);
        } else if (date != null) {
            bookings = bookingRepository.findByBookingDate(date);
        } else if (status != null) {
            bookings = bookingRepository.findByStatus(status);
        } else {
            bookings = bookingRepository.findAll();
        }

        return bookings.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Page<BookingResponseDTO> getBookingsWithPagination(int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return bookingRepository.findAll(pageable).map(this::mapToDTO);
    }

    public Page<BookingResponseDTO> advancedSearch(
            String facility,
            LocalDate date,
            BookingStatus status,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return bookingRepository.advancedSearch(facility, date, status, pageable)
                .map(this::mapToDTO);
    }

    public DashboardStatsDTO getDashboardStats() {
        DashboardStatsDTO stats = new DashboardStatsDTO();

        stats.setTotalBookings(bookingRepository.count());
        stats.setPendingBookings(bookingRepository.countByStatus(BookingStatus.PENDING));
        stats.setApprovedBookings(bookingRepository.countByStatus(BookingStatus.APPROVED));
        stats.setRejectedBookings(bookingRepository.countByStatus(BookingStatus.REJECTED));

        return stats;
    }

    private void validateTimeRange(BookingRequestDTO dto) {
        if (dto.getStartTime() == null || dto.getEndTime() == null) {
            throw new RuntimeException("Start time and end time are required");
        }

        if (!dto.getStartTime().isBefore(dto.getEndTime())) {
            throw new RuntimeException("Start time must be before end time");
        }
    }

    private void validateConflict(BookingRequestDTO dto, Long bookingIdToExclude) {
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                dto.getFacilityName(),
                dto.getBookingDate(),
                dto.getStartTime(),
                dto.getEndTime()
        );

        if (bookingIdToExclude != null) {
            conflicts = conflicts.stream()
                    .filter(booking -> !booking.getId().equals(bookingIdToExclude))
                    .collect(Collectors.toList());
        }

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("This facility is already booked for the selected date and time");
        }
    }

    private BookingResponseDTO mapToDTO(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(booking.getId());
        dto.setFacilityName(booking.getFacilityName());
        dto.setBookingDate(booking.getBookingDate());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setAttendees(booking.getAttendees());
        dto.setPurpose(booking.getPurpose());
        dto.setBookedBy(booking.getBookedBy());
        dto.setStatus(booking.getStatus());
        return dto;
    }
}