declare const _default: () => {
    port: number;
    environment: string;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    app: {
        name: string;
        version: string;
        frontendUrl: string;
    };
};
export default _default;
