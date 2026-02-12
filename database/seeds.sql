-- RBAC System Seeds for bim_system
USE `bim_system`;

-- 1. Insert Default Roles
INSERT INTO `roles` (`name`) VALUES 
('admin'),
('supervisor'),
('employee');

-- 2. Insert Default Permissions
INSERT INTO `permissions` (`name`) VALUES 
('read'),
('edit'),
('update'),
('delete'),
('approve'),
('export'),
('assign');

-- 3. Insert Modules
INSERT INTO `modules` (`name`) VALUES 
('BIMCAPABILITY'),
('KNOWLEDGE_BASE'),
('IT_RESOURCE_PORTAL'),
('HR_RESOURCES');

-- 4. Insert Features
-- BIMCAPABILITY Features
SET @module_id = (SELECT `id` FROM `modules` WHERE `name` = 'BIMCAPABILITY');
INSERT INTO `features` (`module_id`, `name`) VALUES 
(@module_id, 'BG IMG'),
(@module_id, 'Company Channel Notification'),
(@module_id, 'BIM Coins Wallet'),
(@module_id, 'Annual Leave Balance'),
(@module_id, 'Task Due'),
(@module_id, 'Weekly Time Tracking'),
(@module_id, 'Widgets'),
(@module_id, 'IT Resources'),
(@module_id, 'Project Dashboard'),
(@module_id, 'Knowledge Base');

-- KNOWLEDGE_BASE Features
SET @module_id = (SELECT `id` FROM `modules` WHERE `name` = 'KNOWLEDGE_BASE');
INSERT INTO `features` (`module_id`, `name`) VALUES 
(@module_id, 'Profile'),
(@module_id, 'Manage Courses'),
(@module_id, 'Manage User'),
(@module_id, 'Manage Learning Path'),
(@module_id, 'Manage Tags'),
(@module_id, 'Assign Course'),
(@module_id, 'Become a BIM Coordinator'),
(@module_id, 'Continue Learning');

-- IT_RESOURCE_PORTAL Features
SET @module_id = (SELECT `id` FROM `modules` WHERE `name` = 'IT_RESOURCE_PORTAL');
INSERT INTO `features` (`module_id`, `name`) VALUES 
(@module_id, 'Home'),
(@module_id, 'Software Library'),
(@module_id, 'Dynamo Library'),
(@module_id, 'Revit Plugins'),
(@module_id, 'Revit Families'),
(@module_id, 'Manage Users'),
(@module_id, 'Manage Software'),
(@module_id, 'Manage Software Bundles'),
(@module_id, 'Account');

-- HR_RESOURCES Features
SET @module_id = (SELECT `id` FROM `modules` WHERE `name` = 'HR_RESOURCES');
INSERT INTO `features` (`module_id`, `name`) VALUES 
(@module_id, 'Add Departments'),
(@module_id, 'Departments List'),
(@module_id, 'Add Designation'),
(@module_id, 'Designation List'),
(@module_id, 'Add Levels'),
(@module_id, 'Level List'),
(@module_id, 'Add Spectrum'),
(@module_id, 'Spectrum List'),
(@module_id, 'Add Employee'),
(@module_id, 'Employee List');

-- 5. Role Permissions Mapping
-- Helper procedure to assign permissions (for cleaner script)
-- Procedure: RoleName, FeatureName, PermissionName
DELIMITER //
CREATE PROCEDURE `AssignPermission`(IN r_name VARCHAR(50), IN f_name VARCHAR(100), IN p_name VARCHAR(50))
BEGIN
    DECLARE r_id INT UNSIGNED;
    DECLARE f_id INT UNSIGNED;
    DECLARE p_id INT UNSIGNED;
    
    SELECT `id` INTO r_id FROM `roles` WHERE `name` = r_name;
    SELECT `id` INTO f_id FROM `features` WHERE `name` = f_name;
    SELECT `id` INTO p_id FROM `permissions` WHERE `name` = p_name;
    
    IF r_id IS NOT NULL AND f_id IS NOT NULL AND p_id IS NOT NULL THEN
        INSERT IGNORE INTO `role_permissions` (`role_id`, `feature_id`, `permission_id`) VALUES (r_id, f_id, p_id);
    END IF;
END //
DELIMITER ;

-- ADMIN: All permissions for all features
-- Using a loop-like logic for Admin
INSERT INTO `role_permissions` (`role_id`, `feature_id`, `permission_id`)
SELECT r.id, f.id, p.id
FROM `roles` r
CROSS JOIN `features` f
CROSS JOIN `permissions` p
WHERE r.name = 'admin';

-- Assign specifically for 'employee' and 'supervisor' as per requirements
-- (Assuming supervisor gets same as employee for now, or you can tailor later)
-- Example for BIMCAPABILITY
CALL AssignPermission('employee', 'BG IMG', 'edit');
CALL AssignPermission('employee', 'BG IMG', 'delete');
CALL AssignPermission('employee', 'BG IMG', 'update');
CALL AssignPermission('employee', 'Company Channel Notification', 'edit');
CALL AssignPermission('employee', 'Company Channel Notification', 'delete');
CALL AssignPermission('employee', 'BIM Coins Wallet', 'read');
CALL AssignPermission('employee', 'Annual Leave Balance', 'read');
CALL AssignPermission('employee', 'Task Due', 'read');
CALL AssignPermission('employee', 'Weekly Time Tracking', 'read');
CALL AssignPermission('employee', 'Widgets', 'read');
CALL AssignPermission('employee', 'Widgets', 'edit');
CALL AssignPermission('employee', 'Widgets', 'update');
CALL AssignPermission('employee', 'IT Resources', 'read');
CALL AssignPermission('employee', 'IT Resources', 'edit');
CALL AssignPermission('employee', 'Knowledge Base', 'read');
CALL AssignPermission('employee', 'Knowledge Base', 'edit');

-- KNOWLEDGE_BASE
CALL AssignPermission('employee', 'Profile', 'read');
CALL AssignPermission('employee', 'Manage Courses', 'read');
CALL AssignPermission('employee', 'Manage Courses', 'update');
CALL AssignPermission('employee', 'Manage Courses', 'delete');
CALL AssignPermission('employee', 'Manage User', 'read');
CALL AssignPermission('employee', 'Manage Learning Path', 'read');
CALL AssignPermission('employee', 'Manage Learning Path', 'edit');
CALL AssignPermission('employee', 'Manage Learning Path', 'update');
CALL AssignPermission('employee', 'Manage Learning Path', 'delete');
CALL AssignPermission('employee', 'Manage Tags', 'read');
CALL AssignPermission('employee', 'Manage Tags', 'edit');
CALL AssignPermission('employee', 'Manage Tags', 'update');
CALL AssignPermission('employee', 'Assign Course', 'delete');
CALL AssignPermission('employee', 'Assign Course', 'update');
CALL AssignPermission('employee', 'Become a BIM Coordinator', 'read');
CALL AssignPermission('employee', 'Become a BIM Coordinator', 'update');
CALL AssignPermission('employee', 'Continue Learning', 'read');

-- IT_RESOURCE_PORTAL
CALL AssignPermission('employee', 'Home', 'read');
CALL AssignPermission('employee', 'Home', 'update');
CALL AssignPermission('employee', 'Software Library', 'read');
CALL AssignPermission('employee', 'Software Library', 'update');
CALL AssignPermission('employee', 'Dynamo Library', 'read');
CALL AssignPermission('employee', 'Revit Plugins', 'read');
CALL AssignPermission('employee', 'Manage Users', 'read');
CALL AssignPermission('employee', 'Manage Software', 'read');
CALL AssignPermission('employee', 'Manage Software', 'edit');
CALL AssignPermission('employee', 'Manage Software', 'update');
CALL AssignPermission('employee', 'Manage Software', 'delete');
CALL AssignPermission('employee', 'Manage Software Bundles', 'read');
CALL AssignPermission('employee', 'Manage Software Bundles', 'edit');
CALL AssignPermission('employee', 'Manage Software Bundles', 'update');
CALL AssignPermission('employee', 'Manage Software Bundles', 'delete');
CALL AssignPermission('employee', 'Account', 'read');

-- HR_RESOURCES
CALL AssignPermission('employee', 'Add Departments', 'read');
CALL AssignPermission('employee', 'Add Departments', 'update');
CALL AssignPermission('employee', 'Departments List', 'read');
CALL AssignPermission('employee', 'Departments List', 'edit');
CALL AssignPermission('employee', 'Departments List', 'delete');
CALL AssignPermission('employee', 'Add Designation', 'update');
CALL AssignPermission('employee', 'Designation List', 'read');
CALL AssignPermission('employee', 'Designation List', 'edit');
CALL AssignPermission('employee', 'Designation List', 'delete');
CALL AssignPermission('employee', 'Add Levels', 'update');
CALL AssignPermission('employee', 'Level List', 'read');
CALL AssignPermission('employee', 'Level List', 'edit');
CALL AssignPermission('employee', 'Level List', 'update');
CALL AssignPermission('employee', 'Level List', 'delete');
CALL AssignPermission('employee', 'Add Spectrum', 'edit');
CALL AssignPermission('employee', 'Add Spectrum', 'update');
CALL AssignPermission('employee', 'Spectrum List', 'edit');
CALL AssignPermission('employee', 'Spectrum List', 'delete');
CALL AssignPermission('employee', 'Add Employee', 'read');
CALL AssignPermission('employee', 'Add Employee', 'edit');
CALL AssignPermission('employee', 'Add Employee', 'update');
CALL AssignPermission('employee', 'Employee List', 'read');
CALL AssignPermission('employee', 'Employee List', 'delete');

-- Supervisor inherits employee + maybe more? (Prompt says default roles, but mentions these features specifically)
-- For now, let's copy employee to supervisor to ensure they have at least that.
INSERT IGNORE INTO `role_permissions` (`role_id`, `feature_id`, `permission_id`)
SELECT (SELECT `id` FROM `roles` WHERE `name` = 'supervisor'), `feature_id`, `permission_id`
FROM `role_permissions`
WHERE `role_id` = (SELECT `id` FROM `roles` WHERE `name` = 'employee');

-- Cleanup: Drop the temporary procedure
DROP PROCEDURE IF EXISTS `AssignPermission`;

-- Sample User
INSERT INTO `users` (`name`, `email`, `role_id`) VALUES 
('System Admin', 'admin@bimcap.com', (SELECT id FROM roles WHERE name = 'admin')),
('John Supervisor', 'supervisor@bimcap.com', (SELECT id FROM roles WHERE name = 'supervisor')),
('Jane Employee', 'employee@bimcap.com', (SELECT id FROM roles WHERE name = 'employee'));
