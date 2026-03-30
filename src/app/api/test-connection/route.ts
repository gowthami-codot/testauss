import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        console.log('Testing MongoDB connection...');
        console.log('MONGODB_URI:', process.env.MONGODB_URI);

        const connection = await connectDB();
        console.log('Connection successful:', !!connection);

        // Test basic database operation
        const db = connection.connection.db;
        if (db) {
            const collections = await db.listCollections().toArray();
            console.log('Available collections:', collections.map(c => c.name));

            return NextResponse.json({
                status: 'success',
                message: 'MongoDB connection successful',
                database: db.databaseName,
                collections: collections.map(c => c.name)
            });
        } else {
            return NextResponse.json({
                status: 'error',
                message: 'Database connection exists but database is undefined'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('MongoDB connection test failed:', error);

        return NextResponse.json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            error: error
        }, { status: 500 });
    }
}
