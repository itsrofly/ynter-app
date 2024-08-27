import * as Sentry from "@sentry/electron/main";
import { app } from "electron";
import knex from "knex";
import path from "path";

Sentry.init({
    dsn: "https://1c08a05bf43a9d508cdf18e2d9ff25e5@o4507732393525248.ingest.de.sentry.io/4507787898847312",
});

export const connection = async (_event, query: string, params?: any[]) => {
    try {
        // Create connection, it will create the database file if not exist
        const conn = knex({
            client: 'sqlite3',
            connection: {
                filename: path.join(app.getPath("userData"), "Data.db"),
            },
            useNullAsDefault: true
        })

        // Same as before, cannot run all queries at the same time
        await conn.raw(`
            -- Create table agenda if it does not exist
            CREATE TABLE IF NOT EXISTS agenda (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                note INTEGER,
                importance INTEGER NOT NULL,
                information TEXT NOT NULL
            ); `
        )

        // Create table revenue when database file was created now
        await conn.raw(`
            -- Create table notes if it does not exist
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                data TEXT,
                agenda INTEGER,
                priority INTEGER DEFAULT 0,
                trash INTEGER DEFAULT 0,
                updated_date DATE NOT NULL,
                FOREIGN KEY (agenda) REFERENCES agenda(id)
            );`
        );



        await conn.raw(`
            -- Create table revenue if it does not exist
            CREATE TABLE IF NOT EXISTS revenue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                note INTEGER,
                description TEXT,
                amount INTEGER NOT NULL,
                date DATE NOT NULL,
                category INTEGER NOT NULL,
                type INTEGER NOT NULL,
                bank TEXT NOT NULL,
                recurring INTEGER NOT NULL,
                file_name TEXT,
                file_path TEXT,
                FOREIGN KEY (note) REFERENCES notes(id)
            );`
        )

        await conn.raw(`
            -- Create table expense if it does not exist
            CREATE TABLE IF NOT EXISTS expense (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                note INTEGER,
                description TEXT,
                amount INTEGER NOT NULL,
                date DATE NOT NULL,
                category INTEGER NOT NULL,
                type INTEGER NOT NULL,
                bank TEXT NOT NULL,
                recurring INTEGER NOT NULL,
                file_name TEXT,
                file_path TEXT,
                FOREIGN KEY (note) REFERENCES notes(id)
            );`
        )



        // And just now execute the requested query with params
        const data = await conn.raw(query,
            params ? [...params] : []
        );

        // If the query is an insert, retrieve the last inserted row
        if (query.trim().toLowerCase().startsWith("insert")) {
            // Extract the table name from the query
            const match = query.trim().toLowerCase().match(/^insert\s+into\s+(\w+)/i);
            if (match) {
                const tableName = match[1];
                const lastInsertedRowId = await conn.raw("SELECT last_insert_rowid() AS id;");
                const lastInsertedRow = await conn(tableName)
                    .where('id', lastInsertedRowId[0].id)
                    .first();
                return lastInsertedRow;
            }
        }

        // received data
        return data
    } catch (error) {
        throw error
    }
}