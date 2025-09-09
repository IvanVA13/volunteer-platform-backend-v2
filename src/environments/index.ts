const environment = {
    PORT: process.env.PORT || 5000,
    SALT_PASSWORD: process.env.SALT_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
    REFRESH_SECRET: process.env.REFRESH_SECRET,
}

export default environment
