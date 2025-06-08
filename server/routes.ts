import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { 
  insertBehavioralSessionSchema,
  insertBehavioralMetricSchema,
  insertSecurityEventSchema,
  insertTransactionSchema 
} from "@shared/schema";

// Simple authentication middleware for demo
const demoAuth = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    req.user = { claims: { sub: req.session.user.id } };
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - try Replit auth first, fallback to demo
  try {
    await setupAuth(app);
  } catch (error) {
    console.log("Replit auth not available, using demo auth");
  }

  // Demo login route for testing
  app.post('/api/demo/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Demo user accounts
    const demoAccounts = {
      'demo': { password: 'password123', firstName: 'Demo', lastName: 'User' },
      'john': { password: 'john123', firstName: 'John', lastName: 'Doe' },
      'jane': { password: 'jane123', firstName: 'Jane', lastName: 'Smith' },
      'admin': { password: 'admin123', firstName: 'Admin', lastName: 'User' }
    };
    
    const account = demoAccounts[username as keyof typeof demoAccounts];
    
    if (account && account.password === password) {
      const demoUser = await storage.upsertUser({
        id: `demo-user-${username}`,
        email: `${username}@securebank.com`,
        firstName: account.firstName,
        lastName: account.lastName,
        profileImageUrl: null
      });
      
      (req.session as any).user = { id: demoUser.id };
      res.json({ success: true, user: demoUser });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post('/api/demo/logout', (req, res) => {
    req.session?.destroy(() => {
      res.json({ success: true });
    });
  });

  // Demo user route for authentication check
  app.get('/api/demo/user', async (req, res) => {
    const sessionUser = (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(sessionUser.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Auth routes - try both auth methods
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let userId;
      
      // Try Replit auth first
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      // Fallback to demo auth
      else if (req.session?.user?.id) {
        userId = req.session.user.id;
      }
      else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Behavioral monitoring routes
  app.post('/api/behavioral/session', demoAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertBehavioralSessionSchema.parse({
        ...req.body,
        userId,
      });
      
      const session = await storage.createBehavioralSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating behavioral session:", error);
      res.status(400).json({ message: "Failed to create session" });
    }
  });

  app.patch('/api/behavioral/session/:id', demoAuth, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = req.body;
      
      const session = await storage.updateBehavioralSession(sessionId, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating behavioral session:", error);
      res.status(400).json({ message: "Failed to update session" });
    }
  });

  app.get('/api/behavioral/sessions', demoAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserActiveSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/behavioral/metric', demoAuth, async (req: any, res) => {
    try {
      const metricData = insertBehavioralMetricSchema.parse(req.body);
      const metric = await storage.createBehavioralMetric(metricData);
      res.json(metric);
    } catch (error) {
      console.error("Error creating behavioral metric:", error);
      res.status(400).json({ message: "Failed to create metric" });
    }
  });

  app.get('/api/behavioral/metrics/:sessionId', demoAuth, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const metrics = await storage.getSessionMetrics(sessionId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Anomaly detection and risk scoring
  app.post('/api/behavioral/analyze', demoAuth, async (req: any, res) => {
    try {
      const { featureVector, sessionId } = req.body;
      
      // Mock TensorFlow Lite model inference
      // In a real implementation, this would use a trained model
      const calculateAnomalyScore = (features: number[]): number => {
        // Simple mock scoring based on feature variance
        const mean = features.reduce((a, b) => a + b, 0) / features.length;
        const variance = features.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / features.length;
        
        // Normalize to 0-1 range, where higher variance = higher anomaly score
        const normalizedScore = Math.min(variance / 10, 1);
        
        // Add some randomness for demonstration
        return Math.min(normalizedScore + (Math.random() * 0.2), 1);
      };
      
      const anomalyScore = calculateAnomalyScore(featureVector);
      const isAnomalous = anomalyScore > 0.8;
      
      // Update session with risk score
      if (sessionId) {
        await storage.updateBehavioralSession(sessionId, {
          riskScore: anomalyScore,
          anomalyDetected: isAnomalous,
          featureVector: { vector: featureVector, timestamp: new Date().toISOString() }
        });
      }
      
      res.json({
        anomalyScore,
        isAnomalous,
        threshold: 0.8,
        recommendation: isAnomalous ? 'require_reauth' : 'continue'
      });
    } catch (error) {
      console.error("Error analyzing behavior:", error);
      res.status(500).json({ message: "Failed to analyze behavior" });
    }
  });

  // Security events
  app.post('/api/security/event', demoAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertSecurityEventSchema.parse({
        ...req.body,
        userId,
      });
      
      const event = await storage.createSecurityEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating security event:", error);
      res.status(400).json({ message: "Failed to create security event" });
    }
  });

  app.get('/api/security/events', demoAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const events = await storage.getUserSecurityEvents(userId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching security events:", error);
      res.status(500).json({ message: "Failed to fetch security events" });
    }
  });

  // Banking routes
  app.get('/api/accounts', demoAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let accounts = await storage.getUserAccounts(userId);
      
      // Create default account if none exists
      if (accounts.length === 0) {
        const defaultAccount = await storage.createAccount({
          userId,
          accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
          accountType: 'checking',
          balance: 12459.30
        });
        accounts = [defaultAccount];
      }
      
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get('/api/accounts/:id/transactions', demoAuth, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 10;
      let transactions = await storage.getAccountTransactions(accountId, limit);
      
      // Create sample transactions if none exist
      if (transactions.length === 0) {
        const sampleTransactions = [
          {
            accountId,
            type: 'credit' as const,
            amount: 3200.00,
            description: 'Salary Deposit',
            category: 'income'
          },
          {
            accountId,
            type: 'debit' as const,
            amount: 89.99,
            description: 'Amazon Purchase',
            category: 'shopping'
          },
          {
            accountId,
            type: 'debit' as const,
            amount: 5.67,
            description: 'Starbucks',
            category: 'food'
          }
        ];
        
        for (const tx of sampleTransactions) {
          await storage.createTransaction(tx);
        }
        
        transactions = await storage.getAccountTransactions(accountId, limit);
      }
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transfer', demoAuth, async (req: any, res) => {
    try {
      const { fromAccountId, toAccount, amount, description } = req.body;
      
      // Create transfer transaction
      const transaction = await storage.createTransaction({
        accountId: fromAccountId,
        type: 'debit',
        amount: parseFloat(amount),
        description: description || `Transfer to ${toAccount}`,
        category: 'transfer'
      });
      
      res.json(transaction);
    } catch (error) {
      console.error("Error processing transfer:", error);
      res.status(500).json({ message: "Failed to process transfer" });
    }
  });

  // Analytics dashboard
  app.get('/api/analytics/dashboard', demoAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserSecurityEvents(userId, 100);
      const sessions = await storage.getUserActiveSessions(userId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySessions = sessions.filter(s => 
        s.sessionStart && new Date(s.sessionStart) >= today
      );
      
      const anomalies = events.filter(e => e.eventType === 'anomaly');
      
      res.json({
        sessionsToday: todaySessions.length,
        anomaliesDetected: anomalies.length,
        lastLogin: sessions[0]?.sessionStart || new Date(),
        avgSessionDuration: '8 minutes', // Mock calculation
        riskLevel: anomalies.length > 0 ? 'Medium' : 'Low',
        securityScore: Math.max(95 - (anomalies.length * 5), 70)
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
