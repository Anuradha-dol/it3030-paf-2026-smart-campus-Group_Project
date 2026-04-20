package com.smartcampus.service;

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

    public Booking createBooking(Booking booking) {
        if (booking.getBookingDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Booking date cannot be in the past");
        }

        if (!booking.getEndTime().isAfter(booking.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        booking.setStatus(BookingStatus.PENDING);
        return bookingRepository.save(booking);
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
}