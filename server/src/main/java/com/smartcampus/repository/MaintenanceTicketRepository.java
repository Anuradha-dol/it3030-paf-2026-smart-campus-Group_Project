package com.smartcampus.repository;

import com.smartcampus.model.MaintenanceTicket;
import com.smartcampus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByReporter(User user);
    List<MaintenanceTicket> findByAssignedTechnician(User technician);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "ALTER TABLE maintenance_tickets MODIFY resource_id BIGINT NULL", nativeQuery = true)
    void fixResourceIdConstraint();
}
