-- Nail Glam Hub Database Schema & Seed Data
-- Designed for XAMPP / MySQL / MariaDB (phpMyAdmin)
-- Database Name: nailglamhub_db

CREATE DATABASE IF NOT EXISTS `nailglamhub_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nailglamhub_db`;

-- Drop existing tables in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `promotions`;
DROP TABLE IF EXISTS `reels`;
DROP TABLE IF EXISTS `working_hours`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `technicians`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `salons`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `business_categories`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Business Categories Table
CREATE TABLE `business_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(50) DEFAULT '💅',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fullname` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `password` VARCHAR(255) DEFAULT NULL,
  `user_type` ENUM('customer', 'salon_owner', 'admin') NOT NULL DEFAULT 'customer',
  `avatar` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Salons Table
CREATE TABLE `salons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `owner_id` INT NOT NULL,
  `salon_name` VARCHAR(200) NOT NULL,
  `address` VARCHAR(300) NOT NULL,
  `city` VARCHAR(100) DEFAULT 'Metro Manila',
  `province` VARCHAR(100) DEFAULT 'Metro Manila',
  `postal_code` VARCHAR(20) DEFAULT '1000',
  `landmark` VARCHAR(300) DEFAULT NULL,
  `parking_info` VARCHAR(300) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `description` TEXT,
  `logo` VARCHAR(500) DEFAULT NULL,
  `banner` VARCHAR(500) DEFAULT NULL,
  `avg_rating` DECIMAL(3,2) DEFAULT 5.00,
  `review_count` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `verification_status` ENUM('pending', 'verified', 'rejected') DEFAULT 'verified',
  `category_id` INT DEFAULT 1,
  `category_name` VARCHAR(100) DEFAULT 'Nail Services',
  `latitude` DECIMAL(10,8) DEFAULT 14.5995,
  `longitude` DECIMAL(11,8) DEFAULT 120.9842,
  `featured` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `business_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Services Table
CREATE TABLE `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salon_id` INT NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `duration_minutes` INT NOT NULL DEFAULT 45,
  `category_name` VARCHAR(100) DEFAULT 'Nail Services',
  `image` VARCHAR(500) DEFAULT NULL,
  `is_popular` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Technicians / Staff Table
CREATE TABLE `technicians` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salon_id` INT NOT NULL,
  `fullname` VARCHAR(150) NOT NULL,
  `specialties` VARCHAR(255) DEFAULT 'Gel Art, Russian Manicure',
  `rating` DECIMAL(3,2) DEFAULT 4.90,
  `is_available` BOOLEAN DEFAULT TRUE,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `experience_years` INT DEFAULT 3,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Appointments Table
CREATE TABLE `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(50) DEFAULT NULL,
  `customer_email` VARCHAR(150) DEFAULT NULL,
  `salon_id` INT NOT NULL,
  `salon_name` VARCHAR(200) NOT NULL,
  `service_id` INT NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `technician_id` INT DEFAULT NULL,
  `technician_name` VARCHAR(150) DEFAULT 'Any Available Stylist',
  `appointment_date` DATE NOT NULL,
  `appointment_time` VARCHAR(20) NOT NULL,
  `status` ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `total_price` DECIMAL(10,2) NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Reviews Table
CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salon_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_avatar` VARCHAR(500) DEFAULT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` TEXT NOT NULL,
  `service_name` VARCHAR(150) DEFAULT 'Classic Manicure',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Working Hours Table
CREATE TABLE `working_hours` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salon_id` INT NOT NULL,
  `day_of_week` VARCHAR(20) NOT NULL,
  `opening_time` VARCHAR(10) DEFAULT '09:00',
  `closing_time` VARCHAR(10) DEFAULT '19:00',
  `is_closed` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Reels / Short Videos Table
CREATE TABLE `reels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salon_id` INT NOT NULL,
  `salon_name` VARCHAR(200) NOT NULL,
  `salon_logo` VARCHAR(500) DEFAULT NULL,
  `video_url` VARCHAR(500) NOT NULL,
  `thumbnail` VARCHAR(500) DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `likes` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Promotions Table
CREATE TABLE `promotions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salon_id` INT NOT NULL,
  `salon_name` VARCHAR(200) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `discount_percentage` INT NOT NULL DEFAULT 15,
  `code` VARCHAR(50) NOT NULL,
  `valid_until` DATE NOT NULL,
  `banner` VARCHAR(500) DEFAULT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Announcements Table
CREATE TABLE `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  `target_audience` ENUM('all', 'customers', 'salon_owners') DEFAULT 'all',
  `created_by` VARCHAR(150) DEFAULT 'Administrator',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- SEED DATA INSERTION
-- -------------------------------------------------------------

-- Insert Categories
INSERT INTO `business_categories` (`id`, `category_name`, `description`, `icon`) VALUES
(1, 'Nail Services', 'Professional nail care and beauty services', '💅'),
(2, 'Manicure', 'Nail shaping, cuticle care, polish, and manicure services', '✂️'),
(3, 'Pedicure', 'Foot care, nail shaping, polish, and pedicure treatments', '�'),
(4, 'Nail Art', 'Decorative nail art, chrome, charms, and design services', '✨'),
(5, 'Nail Extensions', 'Gel-X, acrylic, hard gel, and extension services', '�'),
(6, 'Gel Polish', 'Gel polish, shine, strengthening, and premium color services', '🌈'),
(7, 'Nail Care', 'Nail health, strengthening, cuticle, and repair treatments', '🌿'),
(8, 'Nail Design', 'Custom nail design and seasonal nail styling services', '🎨');

-- Insert Users
INSERT INTO `users` (`id`, `fullname`, `email`, `phone`, `user_type`, `avatar`, `status`) VALUES
(1, 'Admin User', 'admin@nailglamhub.com', '09123456789', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'active'),
(2, 'Elena Vance (Salon Owner)', 'salon@nailglamhub.com', '09123456790', 'salon_owner', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 'active'),
(3, 'Sophia Rodriguez', 'customer@nailglamhub.com', '09123456791', 'customer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'active'),
(4, 'Chloe Monet (Glamour Nails)', 'chloe@glamournails.com', '09198765432', 'salon_owner', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'active');

-- Insert Salons
INSERT INTO `salons` (`id`, `owner_id`, `salon_name`, `address`, `city`, `province`, `postal_code`, `landmark`, `parking_info`, `phone`, `email`, `description`, `logo`, `banner`, `avg_rating`, `review_count`, `is_active`, `verification_status`, `category_id`, `category_name`, `latitude`, `longitude`, `featured`) VALUES
(1, 2, 'Luxe Glow Nail & Spa Lounge', 'Unit 402, High Street Promenade, Bonifacio Global City, Taguig', 'Taguig', 'Metro Manila', '1634', 'BGC High Street Promenade, 4th Floor across Central Plaza Fountain', 'Underground B1/B2 Parkade with dedicated Valet & PWD ramp access', '0917-555-4526', 'contact@luxeglownails.com', 'Premier nail sanctuary offering bespoke gel art, Japanese structured overlays, Russian e-file manicures, and soothing organic foot retreats.', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', 4.90, 48, 1, 'verified', 1, 'Nail Services', 14.55050000, 121.05090000, 1),
(2, 4, 'Pink Petal Aesthetic Studio', '2nd Floor, Eastwood City Walk, Libis, Quezon City', 'Quezon City', 'Metro Manila', '1110', 'Eastwood Citywalk 2, beside Cinema Lobby & East Wing Bridge', 'Eastwood Mall Multi-Level Parking (P1-P4) with electric vehicle charging', '0918-333-8877', 'info@pinkpetalstudio.com', 'Trendy Korean and Pinterest-inspired nail art studio specializing in 3D charms, chrome ombré, and hypoallergenic gel builder systems.', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80', 4.80, 36, 1, 'verified', 1, 'Nail Services', 14.61050000, 121.08050000, 1),
(3, 2, 'Velvet Touch Nail Spa & Lashes', 'Level 3, Greenbelt 5, Ayala Center, Makati City', 'Makati', 'Metro Manila', '1228', 'Greenbelt 5, 3rd Level Luxury Wing near Fashion Boulevard', 'Greenbelt Basement 1 & 2 Parking with Greenbelt Valet Station', '0917-888-9922', 'hello@velvettouch.ph', 'High-end beauty retreat offering Japanese gel extensions, premium eyelash lifts, organic herbal pedicures, and pampering hand spas.', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80', 4.95, 62, 1, 'verified', 1, 'Nail Services', 14.55240000, 121.02050000, 1),
(4, 4, 'Glam & Glitter Gel Bar', 'Upper Ground Floor, SM Megamall Building B, EDSA, Mandaluyong', 'Mandaluyong', 'Metro Manila', '1550', 'SM Megamall Building B, UG Level near Mega Fashion Hall Bridge', 'Megamall Mega Fashion Hall & Building B Basement Parking', '0920-777-1122', 'book@glamglitter.com', 'Modern quick-service nail bar catering to busy professionals, offering express builder gels, glitter acrylics, and trendy nail stickers.', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&auto=format&fit=crop&q=80', 4.70, 29, 1, 'verified', 1, 'Nail Services', 14.58420000, 121.05670000, 0),
(5, 2, 'Aura Wellness & Organic Nail Retreat', 'Commerce Ave, Alabang Town Center, Muntinlupa', 'Muntinlupa', 'Metro Manila', '1780', 'Alabang Town Center, Corte de las Palmas near Water Garden Pavilion', 'ATC Covered Multi-Deck Carpark with Open Courtyard Parking', '0915-444-2200', 'contact@aurawellness.ph', 'Holistic, eco-friendly nail haven using non-toxic 10-free vegan polishes, botanical foot baths, and hot stone therapeutic hand massages.', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80', 4.85, 41, 1, 'verified', 3, 'Spa & Wellness', 14.42550000, 121.03150000, 1),
(6, 4, 'Polished Perfection Express', '4th Level, TriNoma Mall, North Avenue, Quezon City', 'Quezon City', 'Metro Manila', '1105', 'TriNoma Mall Level 4 near Garden Restaurant Wing & Cinema Walkway', 'TriNoma Carpark Complex (North & South Decks) with MRT3 walkway access', '0922-999-3311', 'express@polishedperfection.com', 'Fast, immaculate manicures and trendy nail art tailored for students and on-the-go beauty lovers.', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80', 4.65, 22, 1, 'verified', 1, 'Nail Services', 14.65340000, 121.03350000, 0);

-- Insert Services
INSERT INTO `services` (`id`, `salon_id`, `service_name`, `description`, `price`, `duration_minutes`, `category_name`, `image`, `is_popular`) VALUES
(1, 1, 'Signature Russian Gel Manicure', 'Precise dry e-file cuticle care, structured gel overlay, and high-shine non-wipe topcoat lasting up to 4+ weeks.', 1250.00, 60, 'Nail Services', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&auto=format&fit=crop&q=80', 1),
(2, 1, 'Bespoke 3D Nail Art & Chrome', 'Custom hand-painted French, chrome glazing, Swarovski gems, and embossed 3D sculpted accents.', 1850.00, 90, 'Nail Services', 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&auto=format&fit=crop&q=80', 1),
(3, 1, 'Detox Botanical Foot Spa & Pedicure', 'Epsom salt soak, organic lavender exfoliation, callused heel buffing, and relaxing massage.', 950.00, 50, 'Nail Services', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&auto=format&fit=crop&q=80', 0),
(4, 1, 'Japanese Structured Gel Overlay (BIAB)', 'Natural nail strengthening treatment using Japanese builder gel to reinforce brittle nails.', 1400.00, 75, 'Nail Services', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80', 1),
(5, 2, 'Korean Ombré Blush Gel Set', 'Soft gradient blush effect with translucent milky base and crystal micro-pearl highlights.', 1100.00, 60, 'Nail Services', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80', 1),
(6, 2, 'Full Cover Soft Gel Extensions (Apres Style)', 'Lightweight, pre-shaped soft gel nail tips for instant salon-quality length and durability.', 1600.00, 80, 'Nail Services', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&auto=format&fit=crop&q=80', 1),
(7, 3, 'Velvet Luxury Gel Manicure & Hand Mask', 'Hydrating collagen gloves, warm towel wrap, meticulous cuticle prep, and premium vegan gel polish.', 1350.00, 65, 'Nail Services', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80', 1),
(8, 3, 'Japanese Lash Lift & Tint Bundle', 'Keratin lash curling with deep black gloss tint for effortlessly defined natural lashes.', 1500.00, 60, 'Beauty & Makeup', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&auto=format&fit=crop&q=80', 1),
(9, 4, 'Express Gel Manicure', 'Quick shaping, light cuticle clean up, single color gel polish and solar oil finish.', 650.00, 35, 'Nail Services', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80', 1),
(10, 5, 'Organic Aromatherapy Pedicure & Scrub', 'Organic peppermint scrub, foot reflexology, warm tea tree wrap, and non-toxic 10-free polish.', 890.00, 55, 'Spa & Wellness', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80', 1);

-- Insert Technicians
INSERT INTO `technicians` (`id`, `salon_id`, `fullname`, `specialties`, `rating`, `is_available`, `avatar`, `experience_years`) VALUES
(1, 1, 'Maria Santos', 'Russian E-File, BIAB Gel Overlays, French Tips', 4.95, 1, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 6),
(2, 1, 'Camille Navarro', '3D Sculpted Charms, Chrome Finishes, Ombré Art', 4.90, 1, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 4),
(3, 1, 'Jasmine Cruz', 'Pedicure Foot Spa, Reflexology, Soft Gel Extensions', 4.85, 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 5),
(4, 2, 'Hannah Reyes', 'Korean Blush Nails, Y2K Nails, Nail Stickers', 4.88, 1, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 3),
(5, 3, 'Kirsten Dela Cruz', 'Japanese Lash Lifts, Russian Manicure, Hand Care', 4.98, 1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 7);

-- Insert Working Hours
INSERT INTO `working_hours` (`salon_id`, `day_of_week`, `opening_time`, `closing_time`, `is_closed`) VALUES
(1, 'Monday', '09:00', '20:00', 0),
(1, 'Tuesday', '09:00', '20:00', 0),
(1, 'Wednesday', '09:00', '20:00', 0),
(1, 'Thursday', '09:00', '20:00', 0),
(1, 'Friday', '09:00', '21:00', 0),
(1, 'Saturday', '09:00', '21:00', 0),
(1, 'Sunday', '10:00', '19:00', 0),
(2, 'Monday', '10:00', '20:00', 0),
(2, 'Tuesday', '10:00', '20:00', 0),
(2, 'Wednesday', '10:00', '20:00', 0),
(2, 'Thursday', '10:00', '20:00', 0),
(2, 'Friday', '10:00', '21:00', 0),
(2, 'Saturday', '10:00', '21:00', 0),
(2, 'Sunday', '11:00', '19:00', 0);

-- Insert Appointments
INSERT INTO `appointments` (`id`, `customer_id`, `customer_name`, `customer_phone`, `customer_email`, `salon_id`, `salon_name`, `service_id`, `service_name`, `technician_id`, `technician_name`, `appointment_date`, `appointment_time`, `status`, `total_price`, `notes`) VALUES
(1, 3, 'Sophia Rodriguez', '09123456791', 'customer@nailglamhub.com', 1, 'Luxe Glow Nail & Spa Lounge', 1, 'Signature Russian Gel Manicure', 1, 'Maria Santos', '2026-08-28', '14:00', 'confirmed', 1250.00, 'Please prep short almond shape with glazed donut chrome sheen.'),
(2, 3, 'Sophia Rodriguez', '09123456791', 'customer@nailglamhub.com', 1, 'Luxe Glow Nail & Spa Lounge', 2, 'Bespoke 3D Nail Art & Chrome', 2, 'Camille Navarro', '2026-09-02', '16:30', 'pending', 1850.00, 'Adding floral 3D sculpt charms for weekend anniversary.');

-- Insert Reviews
INSERT INTO `reviews` (`salon_id`, `user_id`, `user_name`, `user_avatar`, `rating`, `comment`, `service_name`) VALUES
(1, 3, 'Sophia Rodriguez', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 5, 'Maria is an absolute artist! The Russian manicure is the cleanest I have ever experienced in Manila. Lasted 4 weeks without a single chip!', 'Signature Russian Gel Manicure'),
(1, 1, 'Bianca Tan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 5, 'Clean studio, super hygienic tools out of autoclave pouches, and delicious complimentary rose tea. Highly recommended!', 'Bespoke 3D Nail Art & Chrome'),
(2, 3, 'Patricia Gomez', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 5, 'Hannah did the cutest Korean blush nails with magnetic cat eye shine. Will definitely book again!', 'Korean Ombré Blush Gel Set');

-- Insert Reels
INSERT INTO `reels` (`salon_id`, `salon_name`, `salon_logo`, `video_url`, `thumbnail`, `title`, `description`, `likes`, `views`) VALUES
(1, 'Luxe Glow Nail & Spa Lounge', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&auto=format&fit=crop&q=80', 'https://assets.mixkit.co/videos/preview/mixkit-woman-getting-her-nails-done-at-a-salon-41372-large.mp4', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop&q=80', 'Satisfying Russian E-file Cuticle Transformation ✨', 'Watch how we prep natural nails with surgical precision before applying structured builder gel.', 1420, 8950),
(2, 'Pink Petal Aesthetic Studio', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=300&auto=format&fit=crop&q=80', 'https://assets.mixkit.co/videos/preview/mixkit-manicurist-applying-varnish-on-a-customer-41371-large.mp4', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80', 'Trendy Korean Ombre Blush & Cat Eye 💖', 'Soft translucent blush gel blended with magnetic chrome sparkles for an effortless glow.', 980, 5410);

-- Insert Promotions
INSERT INTO `promotions` (`salon_id`, `salon_name`, `title`, `discount_percentage`, `code`, `valid_until`, `banner`, `description`) VALUES
(1, 'Luxe Glow Nail & Spa Lounge', 'First-Time Client Welcome Treat', 20, 'GLAMNEW20', '2026-12-31', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', 'Enjoy 20% off your first Russian Manicure or Japanese Gel Overlay with complimentary hand scrub.'),
(2, 'Pink Petal Aesthetic Studio', 'Mid-Week Pamper Special', 15, 'PINKWED15', '2026-12-31', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80', 'Get 15% discount on all Soft Gel Extensions booked on Tuesdays & Wednesdays.');

-- Insert Announcements
INSERT INTO `announcements` (`title`, `message`, `priority`, `target_audience`, `created_by`) VALUES
('Welcome to Nail Glam Hub Manila!', 'Discover accredited nail salons, book real-time appointments, and explore trendy styles across Metro Manila.', 'normal', 'all', 'System Administrator'),
('New Store Map & GPS Navigation Available', 'Salons now feature exact GPS coordinates, parking guidelines, and instant Google Maps route guidance.', 'high', 'all', 'Platform Team');
