// Initialize collections and indexes for MongoDB
db = db.getSiblingDB('monorepo_db');

db.createCollection('audit_logs');
db.audit_logs.createIndex({ timestamp: -1 });
db.audit_logs.createIndex({ userId: 1 });
db.audit_logs.createIndex({ action: 1 });

print('MongoDB initialized with audit_logs collection and indexes');

