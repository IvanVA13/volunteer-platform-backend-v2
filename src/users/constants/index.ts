import environment from 'src/environments'
import { JwtOptions } from '../types'

export const ACCESS_OPTIONS: JwtOptions = {
    expiresIn: '5m',
    secret: environment.JWT_SECRET,
}

export const REFRESH_OPTIONS: JwtOptions = {
    expiresIn: '7d',
    secret: environment.REFRESH_SECRET,
}
