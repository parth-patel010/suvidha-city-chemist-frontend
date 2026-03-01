#!/bin/bash

  echo "🏥 Starting Suvidha Pharmacy Management System..."

  # Check if database is initialized
  if [ ! -f ".db-initialized" ]; then
    echo "📊 Initializing database for the first time..."
    npm run db:push
    echo "🌱 Seeding database with sample data..."
    npm run db:seed
    touch .db-initialized
    echo "✅ Database initialized successfully"
  else
    echo "✅ Database already initialized"
  fi

  echo "🚀 Starting application..."
  npm run dev
  