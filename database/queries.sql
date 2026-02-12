-- RBAC System Queries for bim_system
USE `bim_system`;

-- 1. Check if a specific user (by email) has a specific permission for a feature
SELECT COUNT(*) > 0 AS has_access
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN features f ON rp.feature_id = f.id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'employee@bimcap.com'
  AND f.name = 'BG IMG'
  AND p.name = 'edit';

-- 2. List all features and permissions for a specific user
SELECT 
    m.name AS module_name,
    f.name AS feature_name,
    GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') AS permissions
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN features f ON rp.feature_id = f.id
JOIN modules m ON f.module_id = m.id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'employee@bimcap.com'
GROUP BY m.name, f.name
ORDER BY m.name, f.name;

-- 3. Get all users and their assigned roles
SELECT 
    u.name AS user_name,
    u.email,
    r.name AS role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;

-- 4. Get total count of features per module
SELECT 
    m.name AS module_name,
    COUNT(f.id) AS feature_count
FROM modules m
LEFT JOIN features f ON m.id = f.module_id
GROUP BY m.id;

-- 5. Dynamic Role Check (List features an 'admin' can access vs 'employee')
SELECT 
    r.name AS role_name,
    f.name AS feature_name,
    p.name AS permission_name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN features f ON rp.feature_id = f.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('admin', 'employee')
ORDER BY r.name, f.name;
