-- Set isDeleted to 1 for all related user_appointments
UPDATE user_appointment
SET isDeleted = 1
WHERE FK_appointmentId IN (
    SELECT appointmentId FROM appointment WHERE FK_locationId IN (
        SELECT locationId FROM location WHERE label = 'Cocolily studio'
    ) 
);

-- Set isDeleted to 1 for all related appointments
UPDATE appointment 
SET isDeleted = 1
WHERE FK_locationId IN (
    SELECT locationId FROM location WHERE label = 'Cocolily studio'
)
