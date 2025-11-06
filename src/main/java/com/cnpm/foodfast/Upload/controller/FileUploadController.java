package com.cnpm.foodfast.Upload.controller;

import com.cnpm.foodfast.dto.response.API.APIResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FileUploadController {

    // Upload directory - will be created in static/uploads
    private static final String UPLOAD_DIR = "uploads/products/";

    /**
     * Upload product image
     * POST /api/upload/image
     */
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public APIResponse<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        log.info("Upload image request - Filename: {}, Size: {} bytes", file.getOriginalFilename(), file.getSize());

        try {
            // Validate file
            if (file.isEmpty()) {
                return APIResponse.<Map<String, String>>builder()
                        .code(400)
                        .message("File is empty")
                        .build();
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return APIResponse.<Map<String, String>>builder()
                        .code(400)
                        .message("File must be an image")
                        .build();
            }

            // Validate file size (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return APIResponse.<Map<String, String>>builder()
                        .code(400)
                        .message("File size must not exceed 5MB")
                        .build();
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Create upload directory if not exists
            Path uploadPath = Paths.get("src/main/resources/static/" + UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Created upload directory: {}", uploadPath);
            }

            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File saved to: {}", filePath);

            // Generate URL (accessible via static resources)
            String fileUrl = "/" + UPLOAD_DIR + uniqueFilename;

            Map<String, String> result = new HashMap<>();
            result.put("url", fileUrl);
            result.put("filename", uniqueFilename);
            result.put("originalFilename", originalFilename);
            result.put("size", String.valueOf(file.getSize()));
            result.put("contentType", contentType);

            return APIResponse.<Map<String, String>>builder()
                    .result(result)
                    .message("Upload successful")
                    .build();

        } catch (IOException e) {
            log.error("Error uploading file", e);
            return APIResponse.<Map<String, String>>builder()
                    .code(500)
                    .message("Upload failed: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Delete uploaded image
     * DELETE /api/upload/image?filename=xxx.jpg
     */
    @DeleteMapping("/image")
    public APIResponse<String> deleteImage(@RequestParam("filename") String filename) {
        log.info("Delete image request - Filename: {}", filename);

        try {
            Path filePath = Paths.get("src/main/resources/static/" + UPLOAD_DIR + filename);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted: {}", filePath);
                
                return APIResponse.<String>builder()
                        .result("File deleted successfully")
                        .message("Delete successful")
                        .build();
            } else {
                return APIResponse.<String>builder()
                        .code(404)
                        .message("File not found")
                        .build();
            }
        } catch (IOException e) {
            log.error("Error deleting file", e);
            return APIResponse.<String>builder()
                    .code(500)
                    .message("Delete failed: " + e.getMessage())
                    .build();
        }
    }
}
