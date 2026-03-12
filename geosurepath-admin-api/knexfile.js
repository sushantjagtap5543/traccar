module.exports = {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/traccar',
        migrations: {
            directory: './migrations'
        },
        seeds: {
            directory: './seeds'
        }
    },
    production: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        migrations: {
            directory: './migrations'
        }
    }
};
