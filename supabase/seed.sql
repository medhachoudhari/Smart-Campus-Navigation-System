-- CampusSense AI - Initial Seed Data for BIET Campus

-- Clear existing data (if re-running)
TRUNCATE TABLE routes, locations CASCADE;

-- Insert Locations
INSERT INTO locations (id, name, type, x, y, description) VALUES
    ('main_gate', 'Main Gate', 'entrance', 100, 50, 'Primary campus entrance'),
    ('admin_block', 'Administrative Block', 'admin', 250, 120, 'Principal office and administration'),
    ('central_library', 'Central Library', 'library', 400, 200, 'Main campus library'),
    ('cse_dept', 'CSE Department', 'department', 550, 130, 'Computer Science and Engineering'),
    ('ise_dept', 'ISE Department', 'department', 650, 200, 'Information Science and Engineering'),
    ('aiml_dept', 'AIML Department', 'department', 700, 300, 'Artificial Intelligence and Machine Learning'),
    ('ece_dept', 'ECE Department', 'department', 520, 300, 'Electronics and Communication'),
    ('eee_dept', 'EEE Department', 'department', 450, 390, 'Electrical and Electronics'),
    ('mech_dept', 'Mechanical Department', 'department', 320, 440, 'Mechanical Engineering'),
    ('civil_dept', 'Civil Department', 'department', 170, 400, 'Civil Engineering'),
    ('mba_dept', 'MBA Department', 'department', 130, 280, 'Master of Business Administration'),
    ('mca_dept', 'MCA Department', 'department', 130, 360, 'Master of Computer Applications'),
    ('placement_cell', 'Placement Cell', 'office', 380, 100, 'Training and Placement Office'),
    ('auditorium', 'Auditorium', 'facility', 200, 200, 'Main campus auditorium'),
    ('seminar_hall', 'Seminar Hall', 'facility', 280, 280, 'Event and seminar hall'),
    ('canteen', 'Canteen', 'facility', 500, 450, 'Student canteen and food court'),
    ('parking_area', 'Parking Area', 'parking', 50, 130, 'Student and staff parking'),
    ('sports_ground', 'Sports Ground', 'ground', 650, 470, 'Main athletic field'),
    ('hostel', 'Hostel', 'facility', 750, 100, 'Student accommodation');

-- Insert Routes (Bidirectional connections)
INSERT INTO routes (source, destination, distance, wheelchair_accessible) VALUES
    ('main_gate', 'admin_block', 50, true),
    ('admin_block', 'central_library', 45, true),
    ('central_library', 'cse_dept', 35, true),
    ('central_library', 'ise_dept', 40, true),
    ('central_library', 'aiml_dept', 55, true),
    ('central_library', 'ece_dept', 40, true),
    ('central_library', 'eee_dept', 50, true),
    ('admin_block', 'placement_cell', 60, true),
    ('admin_block', 'auditorium', 40, true),
    ('auditorium', 'seminar_hall', 50, true),
    ('auditorium', 'canteen', 85, true),
    ('main_gate', 'parking_area', 35, true),
    ('parking_area', 'sports_ground', 90, true),
    ('cse_dept', 'ise_dept', 30, true),
    ('ise_dept', 'aiml_dept', 35, true),
    ('ece_dept', 'eee_dept', 25, true),
    ('eee_dept', 'mech_dept', 45, true),
    ('mech_dept', 'civil_dept', 40, true),
    ('civil_dept', 'main_gate', 75, true),
    ('placement_cell', 'canteen', 70, true),
    ('canteen', 'sports_ground', 80, true),
    ('mba_dept', 'mca_dept', 30, true),
    ('auditorium', 'mba_dept', 40, true),
    ('cse_dept', 'hostel', 60, true),
    ('ise_dept', 'hostel', 45, true),
    ('seminar_hall', 'placement_cell', 65, false),
    ('cse_dept', 'ece_dept', 30, false);
