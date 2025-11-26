import { z } from "zod";

// Performance Entry Schema
export const performanceEntrySchema = z.object({
  id: z.string(),
  date: z.string().optional().or(z.literal("")), // Date field for the entry
  link: z.string().url().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  views: z.number().optional(),
  reach: z.number().optional(),
  engagement: z.number().optional(),
  voiceArtist: z.string().optional().or(z.literal("")),
  scriptWriter: z.string().optional().or(z.literal("")),
  videoEditor: z.string().optional().or(z.literal("")),
  topicSelector: z.string().optional().or(z.literal("")),
  mojoReporter: z.string().optional().or(z.literal("")),
  jelaReporter: z.string().optional().or(z.literal("")),
  photoCard: z.string().optional().or(z.literal("")),
  seo: z.string().optional().or(z.literal("")),
  websiteNews: z.string().optional().or(z.literal("")),
  contentStatus: z.enum([
    "writing",
    "footage",
    "voiceover",
    "thumbnail",
    "editing",
    "ready",
    "alldone",
    "published"
  ]).optional(),
  createdAt: z.string(), // ISO date string
});

export const insertPerformanceEntrySchema = performanceEntrySchema.omit({ id: true, createdAt: true });

export type PerformanceEntry = z.infer<typeof performanceEntrySchema>;
export type InsertPerformanceEntry = z.infer<typeof insertPerformanceEntrySchema>;

// Admin Settings Schema
export const adminSettingsSchema = z.object({
  currentMonth: z.string(), // Format: "YYYY-MM"
  employeeOfMonthMessage: z.string(),
  requisitionHeaderTitle: z.string().default("Daily Our Bangladesh"),
  expenseHeaderTitle: z.string().default("Daily Our Bangladesh"),
  requisitionHeaderSubtitle: z.string().default("Requisition Month of"),
  expenseHeaderSubtitle: z.string().default("Expense Month of"),
  requisitionPreparedBy: z.string().default("Administrator"),
  expensePreparedBy: z.string().default("Administrator"),
  officeStartTime: z.string().default("08:00"), // Format: "HH:MM"
});

export type AdminSettings = z.infer<typeof adminSettingsSchema>;

// YouTube Video Info Response
export const youtubeVideoInfoSchema = z.object({
  title: z.string(),
  views: z.number(),
});

export type YouTubeVideoInfo = z.infer<typeof youtubeVideoInfoSchema>;

// Employee Data Schema
export const employeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  designation: z.string().optional().or(z.literal("")),
  holiday: z.string().optional().or(z.literal("")),
  salary: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  officeShift: z.string().optional().or(z.literal("")),
  officeInTime: z.string().optional().or(z.literal("")),
  officeOutTime: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
  createdAt: z.string(),
});

export const insertEmployeeSchema = employeeSchema.omit({ id: true, createdAt: true });

export type Employee = z.infer<typeof employeeSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Employee User Schema (for employees who can login)
export const employeeUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  createdAt: z.string(),
});

export type EmployeeUser = z.infer<typeof employeeUserSchema>;

// Jela Reporter Data Schema
export const jelaReporterSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  designation: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
  createdAt: z.string(),
});

export const insertJelaReporterSchema = jelaReporterSchema.omit({ id: true, createdAt: true });

export type JelaReporter = z.infer<typeof jelaReporterSchema>;
export type InsertJelaReporter = z.infer<typeof insertJelaReporterSchema>;

// Super Moderator Schema with permissions
export const superModeratorPermissionsSchema = z.object({
  canViewDashboard: z.boolean().default(true),
  canAddDashboard: z.boolean().default(false),
  canEditDashboard: z.boolean().default(false),
  canDeleteDashboard: z.boolean().default(false),
  canViewVoiceArtist: z.boolean().default(true),
  canAddVoiceArtist: z.boolean().default(false),
  canEditVoiceArtist: z.boolean().default(false),
  canDeleteVoiceArtist: z.boolean().default(false),
  canViewAttendance: z.boolean().default(true),
  canAddAttendance: z.boolean().default(false),
  canEditAttendance: z.boolean().default(false),
  canDeleteAttendance: z.boolean().default(false),
  canViewWorkFlow: z.boolean().default(true),
  canAddWorkFlow: z.boolean().default(false),
  canEditWorkFlow: z.boolean().default(false),
  canDeleteWorkFlow: z.boolean().default(false),
  canViewVideoUpload: z.boolean().default(true),
  canAddVideoUpload: z.boolean().default(false),
  canEditVideoUpload: z.boolean().default(false),
  canDeleteVideoUpload: z.boolean().default(false),
  canViewComplaintBox: z.boolean().default(true),
  canAddComplaintBox: z.boolean().default(false),
  canViewRequisition: z.boolean().default(true),
  canAddRequisition: z.boolean().default(false),
  canEditRequisition: z.boolean().default(false),
  canDeleteRequisition: z.boolean().default(false),
  canViewExpense: z.boolean().default(true),
  canAddExpense: z.boolean().default(false),
  canEditExpense: z.boolean().default(false),
  canDeleteExpense: z.boolean().default(false),
  canViewAssignment: z.boolean().default(true),
  canAddAssignment: z.boolean().default(false),
  canEditAssignment: z.boolean().default(false),
  canDeleteAssignment: z.boolean().default(false),
});

export const superModeratorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  userId: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
  permissions: superModeratorPermissionsSchema,
  createdAt: z.string(),
});

export type SuperModeratorPermissions = z.infer<typeof superModeratorPermissionsSchema>;
export type SuperModerator = z.infer<typeof superModeratorSchema>;

// Complaint Box Schema
export const complaintSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  submittedBy: z.string(),
  submittedById: z.string(),
  submittedByRole: z.string(),
  status: z.enum(["pending", "in-progress", "resolved", "closed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  replies: z.array(z.object({
    id: z.string(),
    message: z.string(),
    repliedBy: z.string(),
    repliedByRole: z.string(),
    timestamp: z.string(),
  })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Complaint = z.infer<typeof complaintSchema>;

// Requisition Sheet Schema
export const requisitionItemSchema = z.object({
  id: z.string(),
  sl: z.number(),
  department: z.string(),
  itemDescription: z.string(),
  justification: z.string(),
  quantity: z.number(),
  unit: z.number(),
  price: z.number(),
  remarks: z.string().optional().or(z.literal("")),
});

export const requisitionSheetSchema = z.object({
  id: z.string(),
  month: z.string(),
  year: z.string(),
  items: z.array(requisitionItemSchema),
  totalAmount: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RequisitionItem = z.infer<typeof requisitionItemSchema>;
export type RequisitionSheet = z.infer<typeof requisitionSheetSchema>;

// Expense Sheet Schema
export const expenseItemSchema = z.object({
  id: z.string(),
  sl: z.number(),
  details: z.string(),
  amount: z.number(),
});

export const expenseSheetSchema = z.object({
  id: z.string(),
  month: z.string(),
  year: z.string(),
  items: z.array(expenseItemSchema),
  totalAmount: z.number(),
  paidAmount: z.number(),
  dueAmount: z.number(),
  paidLabel: z.string().optional().or(z.literal("")),
  dueLabel: z.string().optional().or(z.literal("")),
  date: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExpenseItem = z.infer<typeof expenseItemSchema>;
export type ExpenseSheet = z.infer<typeof expenseSheetSchema>;

// Chat Box Schemas
export const chatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
  message: z.string(),
  timestamp: z.string(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  isPinned: z.boolean().default(false),
  readBy: z.array(z.string()).default([]),
  replyTo: z.object({
    messageId: z.string(),
    userName: z.string(),
    message: z.string(),
  }).optional(),
  mentions: z.array(z.string()).default([]),
});

export const chatUserStatusSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
  status: z.enum(["online", "offline"]),
  lastSeen: z.string(),
});

export const chatSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  fileSharingEnabled: z.boolean().default(true),
  moderatorOnlyMode: z.boolean().default(false),
});

export const blockedUserSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  blockedBy: z.string(),
  blockedAt: z.string(),
  reason: z.string().optional(),
});

export const mutedUserSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  mutedBy: z.string(),
  mutedAt: z.string(),
  mutedUntil: z.string().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatUserStatus = z.infer<typeof chatUserStatusSchema>;
export type ChatSettings = z.infer<typeof chatSettingsSchema>;
export type BlockedUser = z.infer<typeof blockedUserSchema>;
export type MutedUser = z.infer<typeof mutedUserSchema>;

// WebSocket Message Types
export type WSMessage = 
  | { type: 'chat_message'; data: ChatMessage }
  | { type: 'user_status'; data: ChatUserStatus }
  | { type: 'message_read'; data: { messageId: string; userId: string } }
  | { type: 'message_pinned'; data: { messageId: string; isPinned: boolean } }
  | { type: 'user_blocked'; data: { userId: string } }
  | { type: 'user_unblocked'; data: { userId: string } }
  | { type: 'user_muted'; data: { userId: string } }
  | { type: 'user_unmuted'; data: { userId: string } }
  | { type: 'chat_cleared'; data: { clearedBy: string } }
  | { type: 'user_typing'; data: { userId: string; userName: string; isTyping: boolean } }
  | { type: 'request_user_list'; data: {} }
  | { type: 'user_list'; data: ChatUserStatus[] };

// App Customization Schema
export const appCustomizationSchema = z.object({
  appName: z.string().default("DOB Performance Tracker"),
  logoUrl: z.string().optional().or(z.literal("")),
  faviconUrl: z.string().optional().or(z.literal("")),
  theme: z.object({
    primary: z.string().default("#e91e63"),
    secondary: z.string().default("#9c27b0"),
    background: z.string().default("#ffffff"),
    foreground: z.string().default("#0a0a0a"),
    muted: z.string().default("#f5f5f5"),
    mutedForeground: z.string().default("#737373"),
  }),
  loginPage: z.object({
    logoUrl: z.string().optional().or(z.literal("")),
    backgroundImageUrl: z.string().optional().or(z.literal("")),
    welcomeText: z.string().default("Enter your credentials to access the dashboard"),
    showDeveloperCredit: z.boolean().default(true),
  }),
});

export type AppCustomization = z.infer<typeof appCustomizationSchema>;

// Assignment Schema
export const assignmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().or(z.literal("")),
  date: z.string(), // Format: "YYYY-MM-DD"
  time: z.string(), // Format: "HH:MM"
  assignedTo: z.string().min(1, "Assigned to is required"),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "ongoing", "completed"]),
  attachments: z.array(z.object({
    id: z.string(),
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string(),
    uploadedAt: z.string(),
  })).default([]),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Assignment = z.infer<typeof assignmentSchema>;

// Feature Toggles Schema
export const featureTogglesSchema = z.object({
  voiceArtistEnabled: z.boolean().default(true),
  attendanceEnabled: z.boolean().default(true),
  workFlowEnabled: z.boolean().default(true),
  videoUploadTimeEnabled: z.boolean().default(true),
  assignmentEnabled: z.boolean().default(true),
});

export type FeatureToggles = z.infer<typeof featureTogglesSchema>;
