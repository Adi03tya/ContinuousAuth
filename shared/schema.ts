import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  real,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Behavioral sessions to track user sessions
export const behavioralSessions = pgTable("behavioral_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  riskScore: real("risk_score"),
  anomalyDetected: boolean("anomaly_detected").default(false),
  featureVector: jsonb("feature_vector"),
  metadata: jsonb("metadata"),
});

// Behavioral metrics captured during sessions
export const behavioralMetrics = pgTable("behavioral_metrics", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => behavioralSessions.id),
  metricType: varchar("metric_type").notNull(), // 'mouse', 'keyboard', 'touch', 'motion'
  timestamp: timestamp("timestamp").defaultNow(),
  data: jsonb("data").notNull(),
});

// Security events and anomalies
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: integer("session_id").references(() => behavioralSessions.id),
  eventType: varchar("event_type").notNull(), // 'anomaly', 'reauth', 'login', 'logout'
  riskScore: real("risk_score"),
  details: jsonb("details"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mock banking accounts
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  accountNumber: varchar("account_number").notNull().unique(),
  accountType: varchar("account_type").notNull(), // 'checking', 'savings'
  balance: real("balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mock transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  type: varchar("type").notNull(), // 'credit', 'debit'
  amount: real("amount").notNull(),
  description: varchar("description").notNull(),
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertBehavioralSessionSchema = createInsertSchema(behavioralSessions).omit({
  id: true,
  sessionStart: true,
});
export type InsertBehavioralSession = z.infer<typeof insertBehavioralSessionSchema>;
export type BehavioralSession = typeof behavioralSessions.$inferSelect;

export const insertBehavioralMetricSchema = createInsertSchema(behavioralMetrics).omit({
  id: true,
  timestamp: true,
});
export type InsertBehavioralMetric = z.infer<typeof insertBehavioralMetricSchema>;
export type BehavioralMetric = typeof behavioralMetrics.$inferSelect;

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  createdAt: true,
});
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
