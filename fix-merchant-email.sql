-- Update all merchants to use the verified email for notifications
UPDATE merchants 
SET notification_email = 'srivastavakshitijprofessional@gmail.com'
WHERE notification_email IS NULL OR notification_email != 'srivastavakshitijprofessional@gmail.com';

-- Show updated merchants
SELECT id, business_name, email, notification_email FROM merchants;
