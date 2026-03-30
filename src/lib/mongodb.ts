import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aussiemale";

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    console.log("Connecting to MongoDB...", cached!.conn ? 'Already connected' : 'Not connected yet');

    if (cached!.conn) {
        return cached!.conn;
    }

    console.log("cheched promise:", cached!.promise);

    if (!cached!.promise) {
        const opts = {
            bufferCommands: false,
        };
        cached!.promise = mongoose.connect(MONGODB_URI, opts);
    }

    try {
        cached!.conn = await cached!.promise;
        console.log('MongoDB connected successfully');
        return cached!.conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

export default connectDB;
