import {
  users,
  behavioralSessions,
  behavioralMetrics,
  securityEvents,
  accounts,
  transactions,
  type User,
  type UpsertUser,
  type BehavioralSession,
  type InsertBehavioralSession,
  type BehavioralMetric,
  type InsertBehavioralMetric,
  type SecurityEvent,
  type InsertSecurityEvent,
  type Account,
  type InsertAccount,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Behavioral monitoring
  createBehavioralSession(session: InsertBehavioralSession): Promise<BehavioralSession>;
  updateBehavioralSession(id: number, updates: Partial<BehavioralSession>): Promise<BehavioralSession>;
  getBehavioralSession(id: number): Promise<BehavioralSession | undefined>;
  getUserActiveSessions(userId: string): Promise<BehavioralSession[]>;
  
  // Behavioral metrics
  createBehavioralMetric(metric: InsertBehavioralMetric): Promise<BehavioralMetric>;
  getSessionMetrics(sessionId: number): Promise<BehavioralMetric[]>;
  
  // Security events
  createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent>;
  getUserSecurityEvents(userId: string, limit?: number): Promise<SecurityEvent[]>;
  
  // Banking operations
  getUserAccounts(userId: string): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  getAccountTransactions(accountId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateAccountBalance(accountId: number, amount: number): Promise<Account>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Behavioral monitoring
  async createBehavioralSession(session: InsertBehavioralSession): Promise<BehavioralSession> {
    const [newSession] = await db
      .insert(behavioralSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateBehavioralSession(id: number, updates: Partial<BehavioralSession>): Promise<BehavioralSession> {
    const [updated] = await db
      .update(behavioralSessions)
      .set(updates)
      .where(eq(behavioralSessions.id, id))
      .returning();
    return updated;
  }

  async getBehavioralSession(id: number): Promise<BehavioralSession | undefined> {
    const [session] = await db
      .select()
      .from(behavioralSessions)
      .where(eq(behavioralSessions.id, id));
    return session;
  }

  async getUserActiveSessions(userId: string): Promise<BehavioralSession[]> {
    return await db
      .select()
      .from(behavioralSessions)
      .where(
        and(
          eq(behavioralSessions.userId, userId),
          eq(behavioralSessions.sessionEnd, null)
        )
      )
      .orderBy(desc(behavioralSessions.sessionStart));
  }

  // Behavioral metrics
  async createBehavioralMetric(metric: InsertBehavioralMetric): Promise<BehavioralMetric> {
    const [newMetric] = await db
      .insert(behavioralMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async getSessionMetrics(sessionId: number): Promise<BehavioralMetric[]> {
    return await db
      .select()
      .from(behavioralMetrics)
      .where(eq(behavioralMetrics.sessionId, sessionId))
      .orderBy(desc(behavioralMetrics.timestamp));
  }

  // Security events
  async createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent> {
    const [newEvent] = await db
      .insert(securityEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async getUserSecurityEvents(userId: string, limit = 10): Promise<SecurityEvent[]> {
    return await db
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.userId, userId))
      .orderBy(desc(securityEvents.createdAt))
      .limit(limit);
  }

  // Banking operations
  async getUserAccounts(userId: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt));
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db
      .insert(accounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async getAccountTransactions(accountId: number, limit = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateAccountBalance(accountId: number, amount: number): Promise<Account> {
    const [updated] = await db
      .update(accounts)
      .set({ balance: amount })
      .where(eq(accounts.id, accountId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
