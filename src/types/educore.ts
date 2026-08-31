export interface EduCoreRegistrationContext {
  studentId: string | null;
  courseCode: string;
  registrationStatus: string;
  failureReason: string | null;
  attemptedAt: string;
  additionalContext: Record<string, unknown> | null;
}
