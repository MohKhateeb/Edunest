-- manual constraints to ensure database data integrity

ALTER TABLE "Review"
ADD CONSTRAINT review_rating_range CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE "SessionReport"
ADD CONSTRAINT report_performance_range
CHECK ("studentPerformance" IS NULL OR ("studentPerformance" >= 1 AND "studentPerformance" <= 5));

ALTER TABLE "TeacherAvailability"
ADD CONSTRAINT availability_day_range CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6);

ALTER TABLE "TeacherAvailability"
ADD CONSTRAINT availability_time_format
CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE "TeacherAvailability"
ADD CONSTRAINT availability_time_order CHECK ("startTime" < "endTime");

ALTER TABLE "Student"
ADD CONSTRAINT student_grade_range CHECK (grade >= 1 AND grade <= 12);
