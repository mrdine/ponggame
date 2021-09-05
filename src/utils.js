import { networkInterfaces } from 'os' // Used to get the current IP address)

export const getCurrentIPAddress = () => {
  return Object.values(networkInterfaces())
    .flat()
    .find((i) => i.family == 'IPv4' && !i.internal).address
}
