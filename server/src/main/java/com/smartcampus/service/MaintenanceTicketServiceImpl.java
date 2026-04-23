package com.smartcampus.service;

import com.smartcampus.dto.CommentDTO;
import com.smartcampus.dto.TicketRequestDTO;
import com.smartcampus.dto.TicketResponseDTO;
import com.smartcampus.enums.Role;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.model.Attachment;
import com.smartcampus.model.Comment;
import com.smartcampus.model.MaintenanceTicket;
import com.smartcampus.model.User;
import com.smartcampus.repository.AttachmentRepository;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.MaintenanceTicketRepository;
import com.smartcampus.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceTicketServiceImpl implements MaintenanceTicketService {

    private final MaintenanceTicketRepository ticketRepository;
    private final AttachmentRepository attachmentRepository;
    private final CommentRepository commentRepository;
    private final UserRepo userRepository;

    private final String uploadDir = "uploads/tickets/";
    
    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            ticketRepository.fixResourceIdConstraint();
        } catch (Exception e) {
            // Ignore if it fails (might be already fixed or DB doesn't support it)
        }
    }

    @Override
    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO request, List<MultipartFile> files, User user) {
        MaintenanceTicket ticket = MaintenanceTicket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority())
                .status(TicketStatus.OPEN)
                .location(request.getLocation())
                .contactNumber(request.getContactNumber())
                .reporter(user)
                .attachments(new ArrayList<>())
                .build();

        MaintenanceTicket savedTicket = ticketRepository.save(ticket);

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                try {
                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Path path = Paths.get(uploadDir);
                    if (!Files.exists(path)) {
                        Files.createDirectories(path);
                    }
                    Files.copy(file.getInputStream(), path.resolve(fileName));

                    Attachment attachment = Attachment.builder()
                            .fileName(file.getOriginalFilename())
                            .filePath(uploadDir + fileName)
                            .fileType(file.getContentType())
                            .ticket(savedTicket)
                            .build();
                    attachmentRepository.save(attachment);
                    savedTicket.getAttachments().add(attachment);
                } catch (IOException e) {
                    throw new RuntimeException("Could not store file. Error: " + e.getMessage());
                }
            }
        }

        return mapToResponseDTO(savedTicket);
    }

    @Override
    public List<TicketResponseDTO> getAllTickets() {
        return ticketRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TicketResponseDTO getTicketById(Long id) {
        MaintenanceTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return mapToResponseDTO(ticket);
    }

    @Override
    @Transactional
    public TicketResponseDTO updateTicketStatus(Long id, TicketStatus status, String notes, User user) {
        MaintenanceTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Security: Only admin or assigned technician can update status
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isAssignedTech = ticket.getAssignedTechnician() != null && 
                                 ticket.getAssignedTechnician().getUserId().equals(user.getUserId());

        if (!isAdmin && !isAssignedTech) {
            throw new RuntimeException("Unauthorized to update ticket status");
        }

        if (status == TicketStatus.REJECTED) {
            if (!isAdmin) throw new RuntimeException("Only admins can reject tickets");
            ticket.setRejectionReason(notes);
        } else {
            ticket.setResolutionNotes(notes);
        }

        ticket.setStatus(status);
        return mapToResponseDTO(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketResponseDTO assignTechnician(Long id, Long technicianId, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can assign technicians");
        }

        MaintenanceTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("User not found: " + technicianId));

        // Allow assigning any non-admin user as technician
        if (technician.getRole() == Role.ADMIN) {
            throw new RuntimeException("Cannot assign an admin as a technician");
        }

        ticket.setAssignedTechnician(technician);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        return mapToResponseDTO(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public TicketResponseDTO addComment(Long id, String message, User user) {
        MaintenanceTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        Comment comment = Comment.builder()
                .message(message)
                .user(user)
                .ticket(ticket)
                .build();

        commentRepository.save(comment);
        return mapToResponseDTO(ticket);
    }

    @Override
    @Transactional
    public void deleteComment(Long ticketId, Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        if (!comment.getUser().getUserId().equals(user.getUserId()) && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Unauthorized to delete this comment");
        }
        
        commentRepository.delete(comment);
    }

    private TicketResponseDTO mapToResponseDTO(MaintenanceTicket ticket) {
        return TicketResponseDTO.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .category(ticket.getCategory())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .createdById(ticket.getReporter().getUserId())
                .createdBy(ticket.getReporter().getFirstname() + " " + ticket.getReporter().getLastName())
                .assignedTechnicianId(ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getUserId() : null)
                .assignedTechnician(ticket.getAssignedTechnician() != null ? 
                        ticket.getAssignedTechnician().getFirstname() + " " + ticket.getAssignedTechnician().getLastName() : "Unassigned")
                .resolutionNotes(ticket.getResolutionNotes())
                .rejectionReason(ticket.getRejectionReason())
                .location(ticket.getLocation())
                .contactNumber(ticket.getContactNumber())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .attachments(ticket.getAttachments().stream()
                        .map(a -> TicketResponseDTO.AttachmentDTO.builder()
                                .id(a.getId())
                                .fileName(a.getFileName())
                                .filePath(a.getFilePath())
                                .fileType(a.getFileType())
                                .build())
                        .collect(Collectors.toList()))
                .comments(ticket.getComments().stream()
                        .map(c -> CommentDTO.builder()
                                .id(c.getId())
                                .message(c.getMessage())
                                .userId(c.getUser().getUserId())
                                .username(c.getUser().getFirstname() + " " + c.getUser().getLastName())
                                .createdAt(c.getCreatedAt())
                                .updatedAt(c.getUpdatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
