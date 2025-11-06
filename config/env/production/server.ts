
export default ({ env }) => ({
        proxy: { koa: true },
        url: env('APP_URL'), // Sets the public URL of the application.
        transfer: {
          token: { salt: env('TRANSFER_TOKEN_SALT') },
          remote: { enabled: true }, // <— allow remote data transfer
        },
        app: { 
          keys: env.array('APP_KEYS')
        },
    });